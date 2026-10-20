// WaitFeed ticker helpers — pure functions, fully unit-tested, no I/O.
import type { FeedItem } from "./types"

const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

/** "2m" / "3h" / "5d" / "now"; "" when the time is unknown. */
export function formatAgo(ts?: number): string {
  if (!ts) return ""
  const delta = Date.now() - ts
  if (delta < MIN) return "now"
  if (delta < HOUR) return `${Math.floor(delta / MIN)}m`
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h`
  return `${Math.floor(delta / DAY)}d`
}

/** "48s" / "1m 32s" / "1h 05m" style wait durations. */
export function formatDuration(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m < 60) return rest === 0 ? `${m}m` : `${m}m ${rest}s`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

/** Store-time description cut, v2 rule: ALWAYS end at a complete sentence —
 * data that ends somewhere ("…can already") reads broken. The last sentence
 * that fits inside the cap wins; terminator + space + capital/digit starts a
 * new sentence (skips "e.g. this" style false hits), and a terminator that
 * IS the last character counts too. When even the first sentence exceeds the
 * cap (super rare), fall back to a word-boundary ellipsis. */
export function truncateSentence(s: string, max: number): string {
  const one = s.replace(/\s+/g, " ").trim()
  if (one.length <= max) return one
  const cut = one.slice(0, max)
  for (let i = cut.length - 1; i >= 0; i--) {
    const ch = cut[i]
    if (ch !== "." && ch !== "!" && ch !== "?") continue
    if (i + 1 < cut.length && cut[i + 1] !== " ") continue // no space after → mid-token
    const next = cut[i + 2]
    if (next !== undefined && !/[A-Z0-9"'’]/.test(next)) continue // lowercase → abbreviation
    return cut.slice(0, i + 1)
  }
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : cut.length)}…`
}

/** Collapse whitespace and cap to one terminal line. */
export function truncate(s: string, max: number): string {
  const one = s.replace(/\s+/g, " ").trim()
  return one.length <= max ? one : `${one.slice(0, max - 1)}…`
}

/** Merge channel groups, dedupe by URL/id, newest first, capped. */
export function mergeItems(groups: FeedItem[][], cap = 30): FeedItem[] {
  const seen = new Set<string>()
  const out: FeedItem[] = []
  for (const group of groups) {
    for (const it of group) {
      const key = (it.url || it.id).trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(it)
    }
  }
  out.sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
  return out.slice(0, cap)
}

/** Parts of one headline, so the UI can color the badge and dim the age. */
export interface HeadlineParts {
  bar: string
  badge: string
  title: string
  ago: string
}

export function headlineParts(it: FeedItem, maxTitle = 70): HeadlineParts {
  return {
    bar: "▍",
    badge: `[${it.source}]`,
    title: truncate(it.title, maxTitle),
    ago: formatAgo(it.time),
  }
}

/** Flat text form, e.g. `▍ [HN] Some title · 2h` (no product prefix — width matters). */
export function headline(it: FeedItem, maxTitle = 70): string {
  const p = headlineParts(it, maxTitle)
  return p.ago ? `${p.bar} ${p.badge} ${p.title} · ${p.ago}` : `${p.bar} ${p.badge} ${p.title}`
}

/** Bare identifiers ("DeepSeek-v4.1-Flash-1017") tell the reader nothing.
 * Owner/repo names ("chenglou/handwired") are kept — readable and precise
 * for a developer audience, and GitHub's context line completes them. */
export function isJunkTitle(title: string): boolean {
  const t = title.trim()
  if (t.length === 0) return true
  if (/\s/.test(t)) return false
  return !/^[\w.-]+\/[\w.-]+$/.test(t)
}

/** Remove junk titles (unreadable bare identifiers) wherever they came from. */
export function dropJunk(items: FeedItem[]): FeedItem[] {
  return items.filter((it) => !isJunkTitle(it.title))
}

/** Smart short source label. Shows the full `host/path` when it fits the
 * width budget; otherwise keeps the host and the LAST path segment and marks
 * the skipped middle with "…" ("github.com/…/esp32-iphone-agent"). Only the
 * visible text is shortened — the clickable target stays the full URL.
 * Never cuts mid-word; the one exception is an extreme slug that cannot fit
 * a single line at all, which gets a clean end-ellipsis. */
export function linkLabel(url: string, maxWidth?: number): string {
  let parts: { host: string; segments: string[]; search: string; path: string } | undefined
  try {
    const u = new URL(url)
    parts = {
      host: u.host,
      path: u.pathname,
      segments: u.pathname.split("/").filter(Boolean),
      search: u.search,
    }
  } catch {
    parts = undefined
  }
  const full = parts
    ? `${parts.host}${parts.path === "/" ? "" : parts.path}${parts.search}`
    : url
  if (maxWidth === undefined || full.length <= maxWidth) return full

  // Too long for the line: skip the middle path pieces, keep host + tail.
  const shortened =
    parts && parts.segments.length > 1
      ? `${parts.host}/…/${parts.segments[parts.segments.length - 1]}${parts.search}`
      : full
  // Extreme case: even the shortened form cannot fit one line — end-ellipsis.
  if (shortened.length > maxWidth) {
    return `${shortened.slice(0, Math.max(1, maxWidth - 1))}…`
  }
  return shortened
}

const normalizeForCompare = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

/** Decode the HTML entities pages love (&amp;, &#x27;, &#39;, …). */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    // pages with a wrong/missing charset leave U+FFFD replacement chars — drop them
    .replace(/\uFFFD/g, "")
}

function safeCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code)
  } catch {
    return ""
  }
}

/** Tags out, text in — for sources like HN self-post text that arrive as HTML. */
export function stripHtmlTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** A context line that basically repeats the headline tells the reader nothing
 * new — hide it. Exact match or a straight prefix-extension both count. */
export function isContextDuplicate(title: string, context: string): boolean {
  const t = normalizeForCompare(title)
  const c = normalizeForCompare(context)
  if (!t || !c) return false
  return c === t || (t.length >= 12 && c.startsWith(`${t} `))
}
