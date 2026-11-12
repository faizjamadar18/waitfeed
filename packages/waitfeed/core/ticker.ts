// WaitFeed ticker helpers — pure functions, fully unit-tested, no I/O.
import type { FeedItem } from "./types"
export type { FeedItem }

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

/** Ticker card meta tail — "▲ 4.0k · 2h" (reader order: points first, age
 * second); either half optional; "" when neither is known. Pure and
 * unit-tested so the card never re-implements the math inline. */
export function formatMeta(score?: number, time?: number): string {
  const pts =
    typeof score === "number" && score > 0
      ? `▲ ${score > 999 ? `${(score / 1000).toFixed(1)}k` : score}`
      : undefined
  const ago = time ? formatAgo(time) : undefined
  const tail = ago ? `· ${ago}` : undefined
  return [pts, tail].filter((p): p is string => Boolean(p)).join(" ")
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
export type DividerLayout = "wide" | "medium" | "narrow" | "words-dropped" | "very-narrow" | "plain"

export interface DividerGlyphs {
  closed: string
  open: string
}

export const DEFAULT_DIVIDER_GLYPHS: DividerGlyphs = {
  closed: "↑",
  open: "↓",
}

/** In hosts where the news ticker renders BELOW the input field (Claude Code,
 * Antigravity CLI statusline), the drawer opens downwards and closes upwards.
 * Therefore:
 * - When closed / not appearing: arrow points downwards (↓) to open drawer.
 * - When open / appearing: arrow points upwards (↑) to close drawer. */
export const BELOW_PROMPT_DIVIDER_GLYPHS: DividerGlyphs = {
  closed: "↓",
  open: "↑",
}

export interface DividerSegments {
  layout: DividerLayout
  left: string
  label: string
  middle: string
  middleIsDashes: boolean
  key: string
  keySuffix: string
  sep: string
  cmd: string
  cmdSuffix: string
  right: string
  text: string
}

/**
 * Responsive "new stories" divider line.
 * Formats unread count and shortcuts to fit terminal width W exactly.
 *
 * Arrow mode (consistent across OpenCode, Claude Code, AGY):
 * ─── ↑/↓ {N} new reads ─────────────── ctrl+o open · /feed all ───
 *
 * Rules:
 * 1. Unread count:
 *    - Real unread count {N} (shows 0 when zero; 99+ when > 99).
 * 2. Theme color segregation:
 *    - key ("ctrl+o") and cmd ("/feed"): bright white (same as ctrl+p in footer).
 *    - label ("↑/↓ {N} new reads"), keySuffix (" open"), sep (" · "), cmdSuffix (" all"): dim grey.
 *    - left, middle, right dashes: subtle border grey.
 * 3. Responsive shrinking order (one row only, never wrap):
 *    - Middle line shrinks first.
 *    - Then "/feed all" (and sep) is dropped.
 *    - Then words "reads" and "open" are dropped.
 *    - Then "new" is dropped.
 *    - Then "ctrl+o" is dropped.
 */
export function formatDividerLine(
  width: number,
  count: number,
  open = false,
  keyOrGlyphs: string | DividerGlyphs = "ctrl+o",
  allCmd: string | undefined = "/feed",
  glyphs?: DividerGlyphs,
): DividerSegments {
  const W = Math.max(1, Math.floor(width))
  const safeCount = Math.max(0, count)
  const countStr = safeCount > 99 ? "99+" : String(safeCount)

  const isGlyphs = typeof keyOrGlyphs === "object" && keyOrGlyphs !== null && "closed" in keyOrGlyphs
  const actualGlyphs = isGlyphs ? (keyOrGlyphs as DividerGlyphs) : glyphs
  const actualKey = isGlyphs ? (typeof allCmd === "string" ? allCmd : "ctrl+o") : (keyOrGlyphs as string)
  const actualCmd = isGlyphs ? undefined : allCmd

  // Arrow / legacy glyph mode (if glyphs explicitly requested as 4th arg)
  if (isGlyphs && actualGlyphs) {
    const arrow = open ? actualGlyphs.open : actualGlyphs.closed
    const fullLabel = `${arrow} ${countStr} new`
    const shortLabel = `${arrow} ${countStr}`
    const wideFixed = 10 + fullLabel.length + actualKey.length
    const mediumFixed = 6 + fullLabel.length + actualKey.length
    const narrowFixed = fullLabel.length + 1 + actualKey.length
    const wordsDroppedFixed = shortLabel.length + 1 + actualKey.length

    if (W >= wideFixed + 6) {
      const middleDashes = "─".repeat(W - wideFixed)
      return {
        layout: "wide",
        left: "─── ",
        label: fullLabel,
        middle: ` ${middleDashes} `,
        middleIsDashes: true,
        key: actualKey,
        keySuffix: "",
        sep: "",
        cmd: "",
        cmdSuffix: "",
        right: " ───",
        text: `─── ${fullLabel} ${middleDashes} ${actualKey} ───`,
      }
    }
    if (W >= mediumFixed + 2) {
      const middleDashes = "─".repeat(W - mediumFixed)
      return {
        layout: "medium",
        left: "─ ",
        label: fullLabel,
        middle: ` ${middleDashes} `,
        middleIsDashes: true,
        key: actualKey,
        keySuffix: "",
        sep: "",
        cmd: "",
        cmdSuffix: "",
        right: " ─",
        text: `─ ${fullLabel} ${middleDashes} ${actualKey} ─`,
      }
    }
    if (W >= narrowFixed) {
      const spaces = " ".repeat(Math.max(1, W - fullLabel.length - actualKey.length))
      return {
        layout: "narrow",
        left: "",
        label: fullLabel,
        middle: spaces,
        middleIsDashes: false,
        key: actualKey,
        keySuffix: "",
        sep: "",
        cmd: "",
        cmdSuffix: "",
        right: "",
        text: `${fullLabel}${spaces}${actualKey}`,
      }
    }
    if (W >= wordsDroppedFixed) {
      const spaces = " ".repeat(Math.max(1, W - shortLabel.length - actualKey.length))
      return {
        layout: "words-dropped",
        left: "",
        label: shortLabel,
        middle: spaces,
        middleIsDashes: false,
        key: actualKey,
        keySuffix: "",
        sep: "",
        cmd: "",
        cmdSuffix: "",
        right: "",
        text: `${shortLabel}${spaces}${actualKey}`,
      }
    }
    const label = shortLabel.length <= W ? shortLabel : shortLabel.slice(0, W)
    return {
      layout: "very-narrow",
      left: "",
      label,
      middle: "",
      middleIsDashes: false,
      key: "",
      keySuffix: "",
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: "",
      text: label,
    }
  }

  // Arrow mode (consistent across OpenCode, Claude Code, AGY: ─── ↑/↓ {N} new reads ─────────── ctrl+o open · /feed all ───)
  const action = open ? "close" : "open"
  const glyphsToUse = actualGlyphs ?? DEFAULT_DIVIDER_GLYPHS
  const arrow = open ? glyphsToUse.open : glyphsToUse.closed

  const labelFull = `${arrow} ${countStr} new reads`
  const labelNoReads = `${arrow} ${countStr} new`
  const labelShort = `${arrow} ${countStr}`

  const hasAll = Boolean(actualCmd && actualCmd.trim().length > 0)
  const key1 = actualKey
  const key1Suffix = ` ${action}`
  const sep = hasAll ? " · " : ""
  const cmd = hasAll ? actualCmd! : ""
  const cmdSuffix = hasAll ? " all" : ""
  const rightFullStr = `${key1}${key1Suffix}${sep}${cmd}${cmdSuffix}`
  const rightNoAllStr = `${key1}${key1Suffix}`
  const rightKeyOnlyStr = key1

  const wideSideChars = 10 // "─── " (4) + " ───" (4) + 2 spaces for middle
  const mediumSideChars = 6 // "─ " (2) + " ─" (2) + 2 spaces for middle

  // 1. Full layout with "/feed all" (shrinks middle line):
  // ─── ↑/↓ {N} new reads ─────────────── ctrl+o open · /feed all ───
  if (hasAll && W >= wideSideChars + labelFull.length + rightFullStr.length + 2) {
    const middleDashes = "─".repeat(W - (wideSideChars + labelFull.length + rightFullStr.length))
    return {
      layout: "wide",
      left: "─── ",
      label: labelFull,
      middle: ` ${middleDashes} `,
      middleIsDashes: true,
      key: key1,
      keySuffix: key1Suffix,
      sep,
      cmd,
      cmdSuffix,
      right: " ───",
      text: `─── ${labelFull} ${middleDashes} ${rightFullStr} ───`,
    }
  }

  // 2. Next to shrink: drop "/feed all" (with middle line shrinking):
  // ─── ↑/↓ {N} new reads ─────────────── ctrl+o open ───
  if (W >= wideSideChars + labelFull.length + rightNoAllStr.length + 2) {
    const middleDashes = "─".repeat(W - (wideSideChars + labelFull.length + rightNoAllStr.length))
    return {
      layout: "wide",
      left: "─── ",
      label: labelFull,
      middle: ` ${middleDashes} `,
      middleIsDashes: true,
      key: key1,
      keySuffix: key1Suffix,
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: " ───",
      text: `─── ${labelFull} ${middleDashes} ${rightNoAllStr} ───`,
    }
  }

  if (W >= mediumSideChars + labelFull.length + rightNoAllStr.length + 2) {
    const middleDashes = "─".repeat(W - (mediumSideChars + labelFull.length + rightNoAllStr.length))
    return {
      layout: "medium",
      left: "─ ",
      label: labelFull,
      middle: ` ${middleDashes} `,
      middleIsDashes: true,
      key: key1,
      keySuffix: key1Suffix,
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: " ─",
      text: `─ ${labelFull} ${middleDashes} ${rightNoAllStr} ─`,
    }
  }

  // 3. Next to shrink: drop the words "reads" and "open":
  // ─── ↑/↓ {N} new ───────────────────── ctrl+o ───
  if (W >= wideSideChars + labelNoReads.length + rightKeyOnlyStr.length + 2) {
    const middleDashes = "─".repeat(W - (wideSideChars + labelNoReads.length + rightKeyOnlyStr.length))
    return {
      layout: "wide",
      left: "─── ",
      label: labelNoReads,
      middle: ` ${middleDashes} `,
      middleIsDashes: true,
      key: key1,
      keySuffix: "",
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: " ───",
      text: `─── ${labelNoReads} ${middleDashes} ${rightKeyOnlyStr} ───`,
    }
  }

  if (W >= mediumSideChars + labelNoReads.length + rightKeyOnlyStr.length + 2) {
    const middleDashes = "─".repeat(W - (mediumSideChars + labelNoReads.length + rightKeyOnlyStr.length))
    return {
      layout: "medium",
      left: "─ ",
      label: labelNoReads,
      middle: ` ${middleDashes} `,
      middleIsDashes: true,
      key: key1,
      keySuffix: "",
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: " ─",
      text: `─ ${labelNoReads} ${middleDashes} ${rightKeyOnlyStr} ─`,
    }
  }

  // 4. Narrow: side bits and middle dashes dropped
  if (W >= labelNoReads.length + 1 + rightKeyOnlyStr.length) {
    const spaces = " ".repeat(Math.max(1, W - labelNoReads.length - rightKeyOnlyStr.length))
    return {
      layout: "narrow",
      left: "",
      label: labelNoReads,
      middle: spaces,
      middleIsDashes: false,
      key: key1,
      keySuffix: "",
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: "",
      text: `${labelNoReads}${spaces}${rightKeyOnlyStr}`,
    }
  }

  // 5. Words dropped: drop "new" (↑/↓ {N}  ctrl+o)
  if (W >= labelShort.length + 1 + rightKeyOnlyStr.length) {
    const spaces = " ".repeat(Math.max(1, W - labelShort.length - rightKeyOnlyStr.length))
    return {
      layout: "words-dropped",
      left: "",
      label: labelShort,
      middle: spaces,
      middleIsDashes: false,
      key: key1,
      keySuffix: "",
      sep: "",
      cmd: "",
      cmdSuffix: "",
      right: "",
      text: `${labelShort}${spaces}${rightKeyOnlyStr}`,
    }
  }

  // 6. Very narrow: drop ctrl+o
  const label = labelShort.length <= W ? labelShort : labelShort.slice(0, W)
  return {
    layout: "very-narrow",
    left: "",
    label,
    middle: "",
    middleIsDashes: false,
    key: "",
    keySuffix: "",
    sep: "",
    cmd: "",
    cmdSuffix: "",
    right: "",
    text: label,
  }
}

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

export interface RetainOptions {
  /** How long previous items stay eligible, epoch ms (defaults to 36h). */
  ttlMs?: number
  /** Final list cap (defaults to 90 — the cycle's CACHE_ITEMS). */
  cap?: number
  /** Timestamp the retention age is measured against (tests inject a fixed one). */
  now?: number
}

/**
 * Carry the previous cycle's list into the fresh fetch instead of replacing
 * it. A single failed channel must never empty the ticker: previous items
 * survive until they age past the retention window, and their stories stay
 * attached (the cache's summaries are keyed by the same url). Fresh data
 * wins url collisions; the result is newest-first and capped. Items without
 * a known time cannot be proven old, so they survive the window.
 */
export function retainMerge(previous: FeedItem[], fresh: FeedItem[], opts: RetainOptions = {}): FeedItem[] {
  const ttlMs = opts.ttlMs ?? 36 * HOUR
  const cap = opts.cap ?? 90
  const now = opts.now ?? Date.now()
  const byKey = new Map<string, FeedItem>()
  for (const it of fresh) byKey.set((it.url || it.id).trim().toLowerCase(), it) // fresh wins
  for (const it of previous) {
    if (typeof it.time === "number" && now - it.time > ttlMs) continue // expired
    const key = (it.url || it.id).trim().toLowerCase()
    if (!byKey.has(key)) byKey.set(key, it)
  }
  return [...byKey.values()].sort((a, b) => (b.time ?? 0) - (a.time ?? 0)).slice(0, cap)
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

/** English-only feed policy. A title or context carrying ANY character from a
 * non-English script (Cyrillic, Arabic, Hebrew, Devanagari, Bengali, Tamil,
 * Thai, Hangul, Kana, Han) is not English — accented Latin (café, ü), emoji
 * and math symbols (Ω, Δ) stay welcome. Applied the moment items arrive (and
 * to every merged cycle, which also prunes foreign items already in the
 * cache), BEFORE enrich and digest work: foreign headlines cost the pipeline
 * nothing and render nowhere. */
const FOREIGN_SCRIPT =
  /[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u0BFF\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/

export function hasForeignScript(...texts: Array<string | undefined>): boolean {
  return texts.some((t) => typeof t === "string" && FOREIGN_SCRIPT.test(t))
}

export function dropNonEnglish(items: FeedItem[]): FeedItem[] {
  return items.filter((it) => !hasForeignScript(it.title, it.context))
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
