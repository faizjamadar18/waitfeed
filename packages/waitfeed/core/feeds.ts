// WaitFeed channels — all free, all keyless, one poll per feed per interval.
// Every fetcher is defensive: failures return [] so one dead channel never
// breaks the whole line. Nothing leaves the machine except these requests.
// Verified 2026-10-17 from this machine: HN/DEV/GH JSON work; Reddit blocks
// non-browser JSON (403 HTML) but serves RSS — so Reddit uses its Atom feed.
import Parser from "rss-parser"
import type { ChannelKey } from "./config"
import type { FeedItem } from "./types"
import { decodeEntities, stripHtmlTags, truncateSentence } from "./ticker"

const UA = "waitfeed/2.0 (local terminal ticker)"
const TIMEOUT_MS = 10_000
/** Longest stored description. The cut (truncateSentence) always lands on a
 * complete sentence, so stored data never ends mid-sentence. The display
 * layer wraps what it gets — it never re-saves the text. */
const CONTEXT_MAX = 600
/** HN look-through: the ID list is one free call, so scanning ~90 fresh
 * stories per cycle costs nothing and keeps the usable pool deep enough
 * that the 60-story runtime target always fills. */
export const HN_LOOK = 90

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

export async function hackerNews(count = HN_LOOK): Promise<FeedItem[]> {
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
      context: selfText.length >= 15 ? truncateSentence(selfText, CONTEXT_MAX) : undefined,
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

export async function devTo(count = 30): Promise<FeedItem[]> {
  const arts = await fetchJson<DevArticle[]>(`https://dev.to/api/articles?per_page=${count}`)
  return arts.flatMap((a) => {
    if (!a.title || !a.url) return []
    return [{
      id: `dev-${a.id ?? a.url}`,
      source: "DEV",
      title: a.title,
      url: a.url,
      context: a.description?.trim() ? truncateSentence(a.description.trim(), CONTEXT_MAX) : undefined,
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

export async function githubTrending(count = 30): Promise<FeedItem[]> {
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
      context: desc ? truncateSentence(desc, CONTEXT_MAX) : undefined,
      time: r.pushed_at ? Date.parse(r.pushed_at) : undefined,
      score: r.stargazers_count,
    }]
  })
}

/** Generic RSS/Atom channel (also the shape future user-supplied feeds use). */
export async function rssChannel(source: string, url: string, count = 15): Promise<FeedItem[]> {
  const feed = await rss.parseURL(url)
  return feed.items.flatMap((e) => {
    const title = e.title?.trim()
    const link = e.link?.trim()
    if (!title || !link) return []
    const snippet = e.contentSnippet?.replace(/\s+/g, " ").trim()
    // Reddit's Atom "content" is just "submitted by /u/x [link] [comments]" —
    // no real description, so leave context undefined (title-only line).
    const useful = snippet && !/^submitted by \//i.test(snippet) ? truncateSentence(snippet, CONTEXT_MAX) : undefined
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

export const redditTech = (count = 25) =>
  rssChannel("R/PROG", "https://www.reddit.com/r/programming/.rss", count)

/** Per-channel outcome for diagnostics: a count of 0 with an error means the
 * channel was contacted and failed; Disabled channels are simply absent. */
export interface ChannelStatus {
  name: string
  count: number
  error?: string
}

export interface FetchAllResult {
  groups: FeedItem[][]
  status: ChannelStatus[]
}

/** Fetch the enabled channels; each failure degrades to an empty group AND
 * is reported by name, so a dead channel is visible in the log instead of
 * silently shrinking the ticker. The enabled map comes from the user config
 * — a disabled channel is never even contacted. User RSS URLs always run
 * (they were explicitly subscribed). Free channels ride the same single
 * response (summaries included), so the larger per-page counts cost zero
 * extra requests — only the fill-up rule on the HN page-visit path (index.ts)
 * spends beyond the direct ask. */
export async function fetchAllFeeds(
  enabled?: Partial<Record<ChannelKey, boolean>>,
  rssUrls: string[] = [],
): Promise<FetchAllResult> {
  const jobs: Array<{ name: string; run: Promise<FeedItem[]> }> = []
  if (enabled?.hn !== false) jobs.push({ name: "HN", run: hackerNews() })
  if (enabled?.devto !== false) jobs.push({ name: "DEV", run: devTo() })
  if (enabled?.github !== false) jobs.push({ name: "GH", run: githubTrending() })
  if (enabled?.reddit !== false) jobs.push({ name: "R/PROG", run: redditTech() })
  for (const url of rssUrls)
    jobs.push({
      name: (() => {
        try {
          return `RSS ${new URL(url).host}`
        } catch {
          return "RSS (bad url)"
        }
      })(),
      run: rssChannel("RSS", url),
    })
  const results = await Promise.allSettled(jobs.map((j) => j.run))
  const groups: FeedItem[][] = []
  const status: ChannelStatus[] = []
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      groups.push(r.value)
      status.push({ name: jobs[i].name, count: r.value.length })
    } else {
      groups.push([])
      status.push({
        name: jobs[i].name,
        count: 0,
        error: (r.reason as Error)?.message ?? String(r.reason),
      })
    }
  })
  return { groups, status }
}