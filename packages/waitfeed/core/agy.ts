// WaitFeed on the Antigravity CLI (agy) — pure adapter logic.
//
// The AGY statusline is a shell command the TUI re-runs whenever the agent
// state changes (its own timing, capped by the host): it pipes a JSON
// payload to stdin and renders our stdout. Every DECISION lives here; the
// shipped .mjs runners are pure glue (parse stdin → call this module →
// print).
//
// Display rules for the AGY port (decided 2026-10-25, field-tested same day):
//   - HEADLINE MODE ONLY + the origin line. AGY plugins expose no LLM API,
//     and the project's identity bans API keys — the card is built from the
//     fed data (headline + score/age meta + the story's link, exactly the
//     linkLabel the OpenCode ticker shows). No third mode is ever mixed in.
//   - NEWS ONLY DURING AN ACTIVE SESSION (user decision 2026-10-25): busy =
//     the documented session states (working, tool_use, reviewing); idle,
//     sign-in/startup (authenticating, initializing), error, and anything
//     unknown or missing defaults to quiet — the splash screen shows nothing.
//   - ONE CARD PER DWELL WINDOW, chosen by WALL-CLOCK time — never by render
//     count. AGY re-renders at unpredictable moments, so a render-count walk
//     made the ticker change at random speeds in the field. The card is a
//     pure function of elapsed dwell windows (default 20s, the OpenCode
//     dwell): any number of redraws inside one window shows the same card.
//   - The dwell clock runs ONLY while busy — idle freezes ticks and the
//     window start, so cards are never skipped while the user reads.
//   - One line per row, never overflowing: the title gets the width budget
//     left after the badge and the meta tail; the badge survives tiny
//     widths; the link line is clamped the same way.
//   - Channel filtering mirrors the OpenCode reader rule exactly — disabled
//     channels vanish, RSS subscriptions always show.
//   - The card is the OpenCode ticker-card shape (decided 2026-10-25):
//     headline row → the item's description wrapped at the terminal width
//     (at most three rows, clipped with an ellipsis — the STORED text is
//     never shortened, only the view) → the origin link row LAST. Items
//     without a description omit those rows entirely; nothing is invented.
//   - COLOR mirrors the OpenCode news-panel palette (tui.tsx): per-channel
//     badge hues on the bar+badge (HN orange, GH green, DEV violet, Reddit
//     pink, RSS amber), clean headline text, muted meta/body/link; unmapped
//     sources fall back to the muted gray.
//   - THE LINK IS A REAL TERMINAL HYPERLINK: OSC 8 with the full URL as the
//     target — ctrl+clickable wherever the terminal supports it (VS Code,
//     Windows Terminal), plain text where it doesn't (graceful degradation).
//   - THE META IS JUSTIFIED TO THE RIGHT EDGE (user decision 2026-10-25,
//     OpenCode ticker-card behavior): the title owns the left, pure padding
//     spaces fill the gap, and the meta ends exactly at the width column.
//     No meta → no padding (never trailing spaces on the line).
import { channelForSource, type WaitFeedConfig } from "./config"
import { formatMeta, linkLabel, truncate } from "./ticker"
import type { CacheFile } from "./pipeline"
import type { FeedItem } from "./types"

const BAR = "▍"
const WIDTH_DEFAULT = 100
const WIDTH_MIN = 30
const WIDTH_MAX = 300
/** Same rhythm as the OpenCode TUI: one card pinned for the whole dwell. */
export const AGY_DWELL_DEFAULT_MS = 20_000

/** Mirror of the OpenCode news-panel palette (tui.tsx channel colors):
 * per-channel badge hues as xterm-256 approximations of the exact hexes.
 * Unmapped sources fall back to the muted gray those panels also use. */
const CHANNEL_ANSI: Record<string, string> = {
  HN: "38;5;202", // #ff6600 — HN orange
  GH: "38;5;71", // #3fb950 — GitHub green
  DEV: "38;5;99", // #8a63f4 — violet
  REDDIT: "38;5;133", // #e36ba0 — pink
  "R/PROG": "38;5;133", // #e36ba0 — pink (Reddit channel alias)
  RSS: "38;5;136", // #d29922 — amber
}
/** Muted gray ≈ the panels' #7d8590: SGR dim has been proven to render in
 * the AGY statusline, so the secondary text rides it. */
const MUTED_ANSI = "2"

/** The agent-state fields of AGY's statusline payload (documented field
 * names: agent_state, terminal_width). */
export interface AgyStatuslineState {
  agent_state?: string
  terminal_width?: number
}

/** Only an ACTIVELY working session wakes the ticker (user decision
 * 2026-10-25): the news must never render on the sign-in splash. Render on
 * the documented session states only; everything else — idle, sign-in and
 * startup phases, errors, anything unknown or missing — stays quiet. */
const SESSION_ACTIVE = new Set(["working", "tool_use", "reviewing"])

export function isAgyBusy(state: AgyStatuslineState): boolean {
  const value = state?.agent_state
  if (typeof value !== "string") return false // no payload (the splash) → quiet
  return SESSION_ACTIVE.has(value.trim().toLowerCase())
}

/** Live terminal width clamped into a sane one-line band. */
export function agyWidth(state: AgyStatuslineState): number {
  const raw = state?.terminal_width
  if (typeof raw !== "number" || !Number.isFinite(raw)) return WIDTH_DEFAULT
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(raw)))
}

/** The same channel rule as the OpenCode reader: user switches hide whole
 * channels, RSS subscriptions always show, and unsupported config shapes
 * fall back to showing everything. */
export function agyVisibleItems(items: FeedItem[], cfg?: WaitFeedConfig | null): FeedItem[] {
  if (!cfg?.sources) return items
  return items.filter((it) => {
    if (it.source === "RSS") return true
    const key = channelForSource(it.source)
    return key !== undefined && cfg.sources[key] === true
  })
}

function clampWidth(width: unknown): number {
  if (typeof width !== "number" || !Number.isFinite(width)) return WIDTH_DEFAULT
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(width)))
}

/**
 * Advance the dwell walk by wall-clock time. `windowStart = 0` means "no
 * busy phase open yet" and simply opens one at `now`. A late redraw (the
 * host was busy elsewhere) skips forward whole windows and lands the phase
 * EXACTLY `windows * dwellMs` ahead, so bookkeeping never drifts and a
 * later, prompt redraw cannot double-advance.
 */
export function agyDwellTick(ticks: number, windowStart: number, now: number, dwellMs: number): {
  ticks: number
  windowStart: number
} {
  if (!(dwellMs > 0)) return { ticks, windowStart } // broken budget → frozen, never advancing
  if (!(windowStart > 0)) return { ticks, windowStart: now } // a fresh busy phase
  const elapsed = now - windowStart
  if (elapsed < dwellMs) return { ticks, windowStart }
  const windows = Math.floor(elapsed / dwellMs)
  return { ticks: ticks + windows, windowStart: windowStart + windows * dwellMs }
}

/** The card at this position of the walk, after the channel filter. */
export function pickAgyCard(items: FeedItem[], position: number, cfg?: WaitFeedConfig | null): FeedItem | undefined {
  const list = agyVisibleItems(items, cfg)
  if (list.length === 0) return undefined
  const effective = ((position % list.length) + list.length) % list.length
  return list[effective]
}

/** The headline row's paintable pieces: title, meta tail (badge is rebuilt
 * by the painter), and `pad` — the justification gap so the meta pins to
 * the right edge exactly like the OpenCode ticker card. The concat
 * `▍ [src] ` + title + pad + meta equals the plain row, so the painter
 * never touches width math — the bounds live in one place only. */
export function agyTickerParts(it: FeedItem, width = WIDTH_DEFAULT): {
  title: string
  meta: string
  pad: number
} {
  const w = clampWidth(width)
  const meta = formatMeta(it.score, it.time)
  const tail = meta ? ` ${meta}` : ""
  const badge = `${BAR} [${it.source}] `
  const budget = Math.max(4, w - badge.length - tail.length)
  const title = truncate(it.title, budget)
  const pad = tail ? Math.max(0, w - badge.length - title.length - tail.length) : 0
  return { title, meta: tail, pad }
}

/** One headline row: `▍ [HN] title · ········ ▲ 120 · 2h` — plain text
 * bounded to `width` characters total, with the meta justified to the
 * right edge (pure padding spaces in the gap, none without a meta). */
export function agyTickerLine(it: FeedItem, width = WIDTH_DEFAULT): string {
  const parts = agyTickerParts(it, width)
  return `${BAR} [${it.source}] ${parts.title}${" ".repeat(parts.pad)}${parts.meta}`
}

/** The origin row shown UNDER the headline — the same short link label the
 * OpenCode ticker and reader print (host/path, shortened to fit). Empty for
 * items without a usable url. Plain text; the runner keeps it bright. */
export function agyLinkLine(it: FeedItem, width = WIDTH_DEFAULT): string {
  const url = typeof it.url === "string" ? it.url.trim() : ""
  if (!url) return ""
  try {
    new URL(url)
  } catch {
    return "" // unparseable → no made-up text on screen
  }
  return linkLabel(url, clampWidth(width))
}

/** The card shows AT MOST this many wrapped description rows — the user's
 * call (2026-10-25): three. Plenty of reading room; the card still can't
 * eat the screen. */
export const AGY_DESC_MAX_ROWS = 3

/** Greedy word wrap at `width`. Provider multi-line text is collapsed to
 * flowing prose first; words longer than the line (naked urls) hard-break
 * across rows. Deterministic, no regex lookahead tricks. */
function wordWrap(text: string, width: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean)
  const lines: string[] = []
  let cur = ""
  for (const word of words) {
    if (word.length > width) {
      // Unbreakable single word: flush and slice it across rows.
      if (cur) {
        lines.push(cur)
        cur = ""
      }
      let rest = word
      while (rest.length > width) {
        lines.push(rest.slice(0, width))
        rest = rest.slice(width)
      }
      cur = rest
      continue
    }
    if (!cur) cur = word
    else if (cur.length + 1 + word.length <= width) cur = `${cur} ${word}`
    else {
      lines.push(cur)
      cur = word
    }
  }
  if (cur) lines.push(cur)
  return lines
}

/** The description (the fed/page metadata the enricher already stored) as
 * display rows: wrapped at the full terminal width, capped at `maxRows`
 * (three), and clipped with an ellipsis when the text exceeds the cap. The
 * stored text is never modified — only the view is bounded. Items without
 * a usable description simply return no rows (no filler on screen). */
export function agyDescRows(it: FeedItem, width = WIDTH_DEFAULT, maxRows = AGY_DESC_MAX_ROWS): string[] {
  const raw = typeof it.context === "string" ? it.context.trim() : ""
  if (!raw || maxRows < 1) return []
  const w = clampWidth(width)
  const lines = wordWrap(raw, w)
  if (lines.length <= maxRows) return lines
  const kept = lines.slice(0, maxRows)
  const last = maxRows - 1
  // The ellipsis signals clipped text; truncate keeps the row at one line.
  kept[last] = truncate(`${kept[last]}…`, w)
  return kept
}

/** Everything the statusline render needs, injected: cache document (or
 * null before the first cycle), user config (or null), the persisted dwell
 * walk (ticks + window start), the user's dwell budget, the agent-state
 * payload AGY piped in — and an optional wall clock for tests. */
export interface AgySnapshot {
  cache: CacheFile | null
  config?: WaitFeedConfig | null
  ticks: number
  windowStart: number
  dwellMs: number
  state: AgyStatuslineState
  now?: number
}

/** The paintable pieces of a headline row: the badge rebuilds from the
 * source and its OpenCode color; title + justification pad + meta concat
 * to the plain row. */
export interface AgyHeadParts {
  source: string
  color: string
  title: string
  meta: string
  pad: number
}

/** One rendered statusline row: plain text (the visible content — every
 * width contract is measured on THIS), plus what it is for the painter: a
 * headline row carries its parts, a context row reads dimmed, and a link
 * row carries the FULL https target for the terminal's ctrl+click (OSC 8). */
export interface AgyRow {
  text: string
  dim: boolean
  parts?: AgyHeadParts
  url?: string
}

// Escape bytes are built from char codes — escape literals must not ride
// through file transports (they have been silently mangled before).
const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)
const wrapAnsi = (code: string, s: string): string => `${ESC}[${code}m${s}${ESC}[0m`
const wrapOsc8 = (url: string, label: string): string => `${ESC}]8;;${url}${BEL}${label}${ESC}]8;;${BEL}`

/** Terminal painting — decided once here like every other presentation
 * rule. Colors mirror the OpenCode news panel: the bar+badge rides its
 * channel color, the headline text stays clean, meta/body/link flow muted.
 * The link additionally becomes a real terminal hyperlink (OSC 8): where
 * the terminal supports it, ctrl+click opens the full URL in the browser;
 * where it doesn't, the label degrades to plain text. */
export function paintAgyRows(rows: AgyRow[]): string[] {
  return rows.map((row) => {
    if (row.url) return wrapOsc8(row.url, wrapAnsi(MUTED_ANSI, row.text))
    if (row.parts) {
      const badge = `${BAR} [${row.parts.source}] `
      const gap = " ".repeat(row.parts.pad)
      return (
        wrapAnsi(row.parts.color, badge) +
        row.parts.title +
        gap +
        (row.parts.meta ? wrapAnsi(MUTED_ANSI, row.parts.meta) : "")
      )
    }
    return row.dim ? wrapAnsi(MUTED_ANSI, row.text) : row.text
  })
}

/** The statusline decision: the full card — headline row, up to three muted
 * description rows, the origin link row LAST — while a session is active
 * (see isAgyBusy); no rows otherwise; plus the dwell walk bookkeeping for
 * the state file. Redraws inside one window are idempotent. */
export function renderAgySnapshot(snap: AgySnapshot): {
  rows: AgyRow[]
  ticks: number
  windowStart: number
} {
  const keep = { rows: [] as AgyRow[], ticks: snap.ticks, windowStart: snap.windowStart }
  if (!isAgyBusy(snap.state)) return keep // quiet: the clock stands still, nothing is skipped
  const items = snap.cache?.items ?? []
  if (items.length === 0) return keep
  const now = snap.now ?? Date.now()
  const ticked = agyDwellTick(snap.ticks, snap.windowStart, now, snap.dwellMs)
  const it = pickAgyCard(items, ticked.ticks, snap.config ?? undefined)
  if (!it) return keep
  const w = agyWidth(snap.state)
  const head = agyTickerParts(it, w)
  const badge = `${BAR} [${it.source}] `
  const rows: AgyRow[] = [
    {
      text: `${badge}${head.title}${" ".repeat(head.pad)}${head.meta}`,
      dim: false,
      parts: {
        source: it.source,
        color: CHANNEL_ANSI[it.source] ?? MUTED_ANSI,
        title: head.title,
        meta: head.meta,
        pad: head.pad,
      },
    },
  ]
  for (const text of agyDescRows(it, w)) rows.push({ text, dim: true })
  const link = agyLinkLine(it, w)
  if (link.length > 0) {
    const url = typeof it.url === "string" ? it.url.trim() : ""
    rows.push({ text: link, dim: false, url })
  }
  return { rows, ticks: ticked.ticks, windowStart: ticked.windowStart }
}
