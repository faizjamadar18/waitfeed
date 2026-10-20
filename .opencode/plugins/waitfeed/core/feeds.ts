// WaitFeed channels — all free, all keyless, one poll per feed per interval.
// Every fetcher is defensive: failures return [] so one dead channel never
// breaks the whole line. Nothing leaves the machine except these requests.
// Verified 2026-10-17 from this machine: HN/DEV/GH JSON work; Reddit blocks
// non-browser JSON (403 HTML) but serves RSS — so Reddit uses its Atom feed.
import Parser from "rss-parser"
import type { ChannelKey } from "./config"
import type { FeedItem } from "./types"
import { decodeEntities, stripHtmlTags } from "./ticker"

const UA = "waitfeed/0.1 (local terminal ticker)"
const TIMEOUT_MS = 10_000
/** Longest stored description. Generous enough that the reader never shows a
 * visible mid-sentence cut; still bounded so the cache stays tiny. The display
 * layer wraps what it gets — it never re-saves the text. */
const CONTEXT_MAX = 600

const rss = new Parser({ timeout: TIMEOUT_MS, headers: { "User-Agent": UA } })

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return (await res.json()) as T
}

interface HNItem {
  id: number
  title?: string
  url?: string
  /** Self-post body (Ask/Show HN) — real description text, keyless. */
  text?: string
  time?: number
  score?: number
}

export async function hackerNews(count = 8): Promise<FeedItem[]> {
  const ids = await fetchJson<number[]>("https://hacker-news.firebaseio.com/v0/topstories.json")
  const top = ids.slice(0, count)
  const fetched = await Promise.allSettled(
    top.map((id) => fetchJson<HNItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)),
  )
  return fetched.flatMap((r) => {
    const v = r.status === "fulfilled" ? r.value : undefined
    if (!v?.title) return []
    const selfText = v.text ? stripHtmlTags(decodeEntities(v.text)) : ""
    return [{
      id: `hn-${v.id}`,
      source: "HN",
      title: v.title,
      url: v.url ?? `https://news.ycombinator.com/item?id=${v.id}`,
      context: selfText.length >= 15 ? truncateInline(selfText, CONTEXT_MAX) : undefined,
      time: v.time ? v.time * 1000 : undefined,
      score: v.score,
    }]
  })
}

interface DevArticle {
  id?: number
  title?: string
  description?: string
  url?: string
  published_at?: string
  positive_reactions_count?: number
}

export async function devTo(count = 8): Promise<FeedItem[]> {
  const arts = await fetchJson<DevArticle[]>(`https://dev.to/api/articles?per_page=${count}`)
  return arts.flatMap((a) => {
    if (!a.title || !a.url) return []
    return [{
      id: `dev-${a.id ?? a.url}`,
      source: "DEV",
      title: a.title,
      url: a.url,
      context: a.description?.trim() ? truncateInline(a.description.trim(), CONTEXT_MAX) : undefined,
      time: a.published_at ? Date.parse(a.published_at) : undefined,
      score: a.positive_reactions_count,
    }]
  })
}

interface GitHubSearch {
  items: Array<{
    id: number
    full_name: string
    description?: string | null
    html_url: string
    pushed_at?: string
    stargazers_count?: number
  }>
}

export async function githubTrending(count = 8): Promise<FeedItem[]> {
  // Trending proxy: repos created in the last 7 days, ranked by stars.
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
  const q = `created:>${since} stars:>50`
  const data = await fetchJson<GitHubSearch>(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${count}`,
  )
  return data.items.flatMap((r) => {
    const desc = (r.description ?? "").trim()
    // Title stays the bare repo name; the description becomes the context line.
    // Bare names (no description) get dropped later unless enrichment rescues them.
    return [{
      id: `gh-${r.id}`,
      source: "GH",
      title: r.full_name,
      url: r.html_url,
      context: desc ? truncateInline(desc, CONTEXT_MAX) : undefined,
      time: r.pushed_at ? Date.parse(r.pushed_at) : undefined,
      score: r.stargazers_count,
    }]
  })
}

/** Generic RSS/Atom channel (also the shape future user-supplied feeds use). */
export async function rssChannel(source: string, url: string, count = 8): Promise<FeedItem[]> {
  const feed = await rss.parseURL(url)
  return feed.items.flatMap((e) => {
    const title = e.title?.trim()
    const link = e.link?.trim()
    if (!title || !link) return []
    const snippet = e.contentSnippet?.replace(/\s+/g, " ").trim()
    // Reddit's Atom "content" is just "submitted by /u/x [link] [comments]" —
    // no real description, so leave context undefined (title-only line).
    const useful = snippet && !/^submitted by \//i.test(snippet) ? truncateInline(snippet, CONTEXT_MAX) : undefined
    return [{
      id: `${source.toLowerCase()}-${(e as { id?: string }).id ?? link}`,
      source,
      title,
      url: link,
      context: useful,
      time: e.isoDate ? Date.parse(e.isoDate) : undefined,
      score: undefined,
    }]
  }).slice(0, count)
}

export const redditTech = (count = 8) =>
  rssChannel("R/PROG", "https://www.reddit.com/r/programming/.rss", count)

/** Fetch the enabled channels; each failure degrades to an empty group. The
 * enabled map comes from the user config — a disabled channel is never even
 * contacted. User RSS URLs always run (they were explicitly subscribed). */
export async function fetchAllFeeds(
  enabled?: Partial<Record<ChannelKey, boolean>>,
  rssUrls: string[] = [],
): Promise<FeedItem[][]> {
  const jobs: Promise<FeedItem[]>[] = []
  if (enabled?.hn !== false) jobs.push(hackerNews())
  if (enabled?.devto !== false) jobs.push(devTo())
  if (enabled?.github !== false) jobs.push(githubTrending())
  if (enabled?.reddit !== false) jobs.push(redditTech())
  for (const url of rssUrls) jobs.push(rssChannel("RSS", url))
  const results = await Promise.allSettled(jobs)
  return results.map((r) => (r.status === "fulfilled" ? r.value : []))
}

function truncateInline(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}
