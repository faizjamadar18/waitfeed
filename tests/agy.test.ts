// AGY adapter tests — the pure logic behind WaitFeed on the Antigravity CLI.
//
// The contract defined here (behavior, not markup):
//   1. The ticker IS the AGY statusline: a shell command receives agent-state
//      JSON on stdin and answers with text. NEWS ONLY DURING AN ACTIVE
//      SESSION (user decision 2026-10-25): busy = the documented session
//      states (working, tool_use, reviewing); idle, sign-in/startup
//      (authenticating, initializing), error, and anything unknown or
//      missing defaults to QUIET — no news on the splash screen.
//   2. HEADCARD DWELL = wall-clock time, NOT render count. OpenCode pins one
//      card for its 20s dwell; AGY re-renders whenever the host feels like
//      it, so the card must be a pure function of elapsed dwell windows.
//      Any number of redraws inside one window shows the SAME card.
//   3. HEADLINE MODE ONLY, WITH THE FULL CARD. The AGY port adds no LLM
//      layer; the card is fed data only, in the OpenCode ticker-card order:
//      headline row → the item's description (the fed/page metadata, wrapped
//      to the terminal width, at most 3 rows, clipped with an ellipsis — the
//      stored text itself is never shortened) → the story's origin link
//      (linkLabel, the same function the OpenCode ticker uses) LAST so the
//      source is verifiable. No summary is invented; items without a
//      description simply omit those rows.
//   4. Every row, never overflowing: the headline title gets the remaining
//      width budget after the badge and the meta tail; description rows wrap
//      at the clamped terminal width; the badge survives tiny widths.
//   5. Channel filtering mirrors the OpenCode reader rule exactly — disabled
//      channels vanish, RSS subscriptions always show.
//   6. The dwell clock runs ONLY while busy: idle freezes ticks and window
//      start, so nothing is skipped while the user reads or types.
import { describe, expect, it } from "vitest"
import {
  AGY_DESC_MAX_ROWS,
  agyDescRows,
  agyDwellTick,
  agyLinkLine,
  agyTickerLine,
  agyTickerParts,
  agyHeadlineRows,
  agyVisibleItems,
  agyWidth,
  isAgyBusy,
  paintAgyRows,
  pickAgyCard,
  renderAgySnapshot,
  type AgyRow,
  type AgySnapshot,
  type AgyStatuslineState,
} from "../packages/waitfeed/core/agy"
import { DEFAULT_CONFIG, type WaitFeedConfig } from "../packages/waitfeed/core/config"
import type { FeedItem } from "../packages/waitfeed/core/types"

function item(title: string, over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: `hn-${title}`,
    source: "HN",
    title,
    url: `https://example.com/${title.toLowerCase().replace(/\s+/g, "-")}`,
    ...over,
  }
}

const cfg = (sources: Partial<WaitFeedConfig["sources"]> = {}): WaitFeedConfig => ({
  ...DEFAULT_CONFIG,
  sources: { ...DEFAULT_CONFIG.sources, ...sources },
  rssUrls: [],
})

describe("isAgyBusy — news only during an active session (user decision 2026-10-25)", () => {
  it("the documented session-active states wake the ticker", () => {
    for (const state of ["working", "tool_use", "reviewing"]) {
      expect(isAgyBusy({ agent_state: state })).toBe(true)
    }
  })

  it("sign-in, startup, idle and error stay quiet", () => {
    for (const state of ["idle", "authenticating", "initializing", "error"]) {
      expect(isAgyBusy({ agent_state: state })).toBe(false)
    }
  })

  it("missing, empty, or unknown state defaults to QUIET — no news on the splash", () => {
    expect(isAgyBusy({})).toBe(false)
    expect(isAgyBusy({ agent_state: "" })).toBe(false)
    expect(isAgyBusy({ agent_state: "   " })).toBe(false)
    expect(isAgyBusy({ agent_state: "something-new" })).toBe(false)
    expect(isAgyBusy(undefined as unknown as AgyStatuslineState)).toBe(false)
  })
})

describe("agyWidth", () => {
  it("defaults to 100 when the payload omits terminal_width", () => {
    expect(agyWidth({})).toBe(100)
  })

  it("clamps extreme values into a sane band", () => {
    expect(agyWidth({ terminal_width: 1 })).toBeGreaterThanOrEqual(30)
    expect(agyWidth({ terminal_width: 0 })).toBeGreaterThanOrEqual(30)
    expect(agyWidth({ terminal_width: 9999 })).toBeLessThanOrEqual(300)
    expect(agyWidth({ terminal_width: 80 })).toBe(80)
  })
})

describe("agyVisibleItems — the reader filter, one card pool", () => {
  const items = [
    item("hn one", { source: "HN" }),
    item("gh one", { source: "GH" }),
    item("dev one", { source: "DEV" }),
    item("rss one", { source: "RSS" }),
  ]

  it("keeps every item when config is missing (before the first config write)", () => {
    expect(agyVisibleItems(items, undefined)).toHaveLength(4)
  })

  it("hides channels the user switched off; RSS subscriptions always show", () => {
    const visible = agyVisibleItems(items, cfg({ hn: false, github: false }))
    expect(visible.map((it) => it.id)).toEqual(["hn-dev one", "hn-rss one"])
  })

  it("an all-off config still shows only the user's RSS items", () => {
    const visible = agyVisibleItems(items, cfg({ hn: false, devto: false, github: false, reddit: false }))
    expect(visible.map((it) => it.id)).toEqual(["hn-rss one"])
  })
})

describe("agyDwellTick — the walk advances by wall-clock, not by renders", () => {
  const DWELL = 20_000

  it("a fresh busy phase opens its first dwell window at now", () => {
    const t = agyDwellTick(0, 0, 1_000, DWELL)
    expect(t).toEqual({ ticks: 0, windowStart: 1_000 })
  })

  it("inside an open window nothing changes — every redraw shows the same card", () => {
    const t1 = agyDwellTick(0, 1_000, 1_500, DWELL)
    const t2 = agyDwellTick(0, 1_000, 1_900, DWELL)
    expect(t1).toEqual({ ticks: 0, windowStart: 1_000 })
    expect(t2).toEqual({ ticks: 0, windowStart: 1_000 })
  })

  it("crossing one window advances exactly one tick", () => {
    expect(agyDwellTick(0, 1_000, 1_000 + DWELL, DWELL)).toEqual({ ticks: 1, windowStart: 1_000 + DWELL })
  })

  it("long redraw gaps skip forward several windows without drifting the phase", () => {
    // Redraws are host-timed; 2.3 dwell windows elapsed → 2 ticks, and the
    // window start lands exactly 2 windows ahead (no slow drift).
    expect(agyDwellTick(3, 10_000, 10_000 + 2.3 * DWELL, DWELL)).toEqual({
      ticks: 5,
      windowStart: 10_000 + 2 * DWELL,
    })
  })

  it("a broken dwell budget never advances (host safety net)", () => {
    expect(agyDwellTick(4, 1_000, 10_000, 0)).toEqual({ ticks: 4, windowStart: 1_000 })
    expect(agyDwellTick(4, 1_000, 10_000, -5)).toEqual({ ticks: 4, windowStart: 1_000 })
  })
})

describe("pickAgyCard — the modulo walk over the visible pool", () => {
  const items = [item("a"), item("b"), item("c")]

  it("the walk position wraps modulo the list length", () => {
    expect(pickAgyCard(items, 0, undefined)?.title).toBe("a")
    expect(pickAgyCard(items, 1, undefined)?.title).toBe("b")
    expect(pickAgyCard(items, 2, undefined)?.title).toBe("c")
    expect(pickAgyCard(items, 3, undefined)?.title).toBe("a")
  })

  it("no cards, no pick", () => {
    expect(pickAgyCard([], 0, undefined)).toBeUndefined()
  })

  it("respects the channel filter while walking", () => {
    const filtered = [item("a"), item("b", { source: "GH" })]
    expect(pickAgyCard(filtered, 1, cfg({ github: false }))?.title).toBe("a")
  })
})

describe("agyTickerLine — one headline line, never overflowing", () => {
  const NOW = Date.now()
  const it1 = item("Just a headline", { time: NOW - 2 * 3_600_000, score: 120 })

  it("stays inside the width budget and carries badge, title and meta", () => {
    const line = agyTickerLine(it1, 120)
    expect(line.length).toBe(120) // justified: the line fills the width exactly
    expect(line.startsWith("▍")).toBe(true)
    expect(line).toContain("[HN]")
    expect(line).toContain("Just a headline")
    expect(line).toContain("▲ 120")
    expect(line).toContain("2h")
  })

  it("justify — the meta is pushed to the right corner, OpenCode-ticker style", () => {
    const line = agyTickerLine(it1, 120)
    const badge = "▍ [HN] "
    const title = "Just a headline"
    const meta = " ▲ 120 · 2h"
    expect(line.endsWith("▲ 120 · 2h")).toBe(true)
    // The gap between the title and the corner-pinned meta is pure padding.
    expect(line.slice(badge.length + title.length, line.length - meta.length)).toBe(
      " ".repeat(120 - badge.length - title.length - meta.length),
    )
  })

  it("a title that fills the budget leaves no padding — meta rides right after", () => {
    const long = item("n".repeat(200), { time: Date.now() - 2 * 3_600_000, score: 120 })
    const line = agyTickerLine(long, 90)
    expect(line.length).toBe(90)
    expect(line.endsWith("2h")).toBe(true)
    expect(line).toContain("▲ 120")
  })

  it("a missing time and score simply leave the tail off (the origin row carries the link)", () => {
    const line = agyTickerLine(item("bare"), 100)
    expect(line).toBe("▍ [HN] bare")
  })

  it("long titles are cut at the remaining budget — the line still fits", () => {
    // Meta-less item: the truncated title owns the whole budget, so the
    // fitted line genuinely ends on the ellipsis.
    const long = item("y".repeat(300))
    const line = agyTickerLine(long, 60)
    expect(line.length).toBeLessThanOrEqual(60)
    expect(line).toContain("[HN]")
    expect(line.endsWith("…")).toBe(true)
  })

  it("at extreme widths the headline is squeezed to almost nothing but the badge survives", () => {
    const line = agyTickerLine(item("tiny budget"), 30)
    expect(line.length).toBeLessThanOrEqual(30)
    expect(line).toContain("[HN]")
  })
})

describe("agyTickerParts — the justify math (meta pins to the right edge)", () => {
  it("pad is the pure-space gap; zero when nothing can justify", () => {
    const parts = agyTickerParts(item("bare"), 100)
    expect(parts.pad).toBe(0) // no meta → no justification, no trailing spaces
    expect(parts.meta).toBe("")
  })

  it("pad fills the width minus badge, title and meta", () => {
    const parts = agyTickerParts(item("alpha", { score: 7 }), 100)
    const badge = "▍ [HN] "
    const expected = Math.max(0, 100 - badge.length - parts.title.length - parts.meta.length)
    expect(parts.pad).toBe(expected)
    expect(parts.pad).toBeGreaterThan(0) // a short title leaves room to justify
  })

  it("a maxed-out title leaves pad 0", () => {
    const parts = agyTickerParts(item("m".repeat(300)), 90)
    expect(parts.pad).toBe(0)
    expect(agyTickerLine(item("m".repeat(300)), 90).length).toBe(90)
  })
})

describe("agyHeadlineRows — multi-line headline wrapping (never truncate, use second line)", () => {
  const NOW = Date.now()

  it("short headlines that fit in one line render as 1 row with right-justified meta", () => {
    const itShort = item("Anthropic releases Claude 3.7", { time: NOW - 3_600_000, score: 840 })
    const rows = agyHeadlineRows(itShort, 80)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text.length).toBe(80)
    expect(rows[0]!.text.startsWith("▍ [HN] Anthropic releases Claude 3.7")).toBe(true)
    expect(rows[0]!.text.endsWith("▲ 840 · 1h")).toBe(true)
  })

  it("long headlines wrap into a second line without cutting any text", () => {
    const longTitle = "Nikon photography contest winner loses title after scientists spot signs of AI in winning image"
    const itLong = item(longTitle, { time: NOW - 3 * 3_600_000, score: 254 })
    const rows = agyHeadlineRows(itLong, 80)
    expect(rows).toHaveLength(2)

    // Row 0 has badge and first part of headline, no ellipsis
    expect(rows[0]!.text.startsWith("▍ [HN] ")).toBe(true)
    expect(rows[0]!.text).not.toContain("…")
    expect(rows[0]!.text.length).toBeLessThanOrEqual(80)

    // Row 1 has indentation matching badge width, continuation of headline, and right-justified meta
    expect(rows[1]!.text.startsWith("       ")).toBe(true) // Indented to align with title text
    expect(rows[1]!.text).not.toContain("…")
    expect(rows[1]!.text.length).toBe(80) // Justified to width
    expect(rows[1]!.text.endsWith("▲ 254 · 3h")).toBe(true)

    // Reconstructed text contains the entire full title with zero missing words
    const reconstructed = `${rows[0]!.text.replace("▍ [HN] ", "").trim()} ${rows[1]!.text.replace("       ", "").replace(/▲.*$/, "").trim()}`
    expect(reconstructed).toBe(longTitle)
  })

  it("headlines without meta wrap to the second line cleanly without trailing padding", () => {
    const longTitle = "Scientists discover new method to convert plastic waste into clean fuel without harmful toxic emissions"
    const itNoMeta = item(longTitle)
    const rows = agyHeadlineRows(itNoMeta, 70)
    expect(rows.length).toBeGreaterThanOrEqual(2)
    for (const r of rows) {
      expect(r.text.length).toBeLessThanOrEqual(70)
      expect(r.text).not.toContain("…")
    }
    const combined = rows.map((r, i) => (i === 0 ? r.text.replace("▍ [HN] ", "").trim() : r.text.trim())).join(" ")
    expect(combined).toBe(longTitle)
  })
})

describe("agyLinkLine — the verifiable origin of the story", () => {
  it("renders the same short link the OpenCode ticker shows", () => {
    expect(agyLinkLine(item("x", { url: "https://news.ycombinator.com/item?id=42" }), 100)).toBe(
      "news.ycombinator.com/item?id=42",
    )
  })

  it("long urls shorten to host + last segment, still on one line", () => {
    const line = agyLinkLine(
      item("x", { url: "https://github.com/chenglou/handwired/tree/main/very/deep/path/segment" }),
      40,
    )
    expect(line.length).toBeLessThanOrEqual(40)
    expect(line).toContain("github.com")
  })

  it("no url or a broken url simply leaves the line empty", () => {
    expect(agyLinkLine(item("x", { url: "" }), 100)).toBe("")
    expect(agyLinkLine(item("x", { url: "not a url" }), 100)).toBe("")
  })
})

describe("agyDescRows — the body of the card, wrapped and capped like OpenCode's", () => {
  it("pins the user's chosen cap at exactly three description rows", () => {
    expect(AGY_DESC_MAX_ROWS).toBe(3)
  })

  it("no description (or blank) simply leaves the rows out — no filler", () => {
    expect(agyDescRows(item("x"), 100)).toEqual([])
    expect(agyDescRows(item("x", { context: "   \n  " }), 100)).toEqual([])
  })

  it("a short description is one row, shown whole — nothing is cut", () => {
    const rows = agyDescRows(item("x", { context: "Ships are hoarding oil at sea." }), 100)
    expect(rows).toEqual(["Ships are hoarding oil at sea."])
  })

  it("rows wrap at the full terminal width — the description shares the card's width", () => {
    // Twenty 10-char words at width 100: 9 words fit one row (98 chars),
    // so the text flows 9, 9, 2 — the first row nearly full width.
    const t = (i: number): string => `w${String(i).padStart(2, "0")}`.padEnd(10, "x")
    const text = Array.from({ length: 20 }, (_, i) => t(i)).join(" ")
    const rows = agyDescRows(item("x", { context: text }), 100)
    expect(rows).toHaveLength(3)
    expect(rows[0]!.length).toBe(98)
    expect(rows.every((r) => r.length <= 100)).toBe(true)
    expect(rows.join(" ")).toBe(text) // fits in 3 rows → every word is on screen
  })

  it("a longer description is capped at three rows with an ellipsis on the last", () => {
    const t = (i: number): string => `w${String(i).padStart(2, "0")}`.padEnd(10, "x")
    const text = Array.from({ length: 41 }, (_, i) => t(i)).join(" ") // needs 5 rows
    const rows = agyDescRows(item("x", { context: text }), 100)
    expect(rows).toHaveLength(3)
    expect(rows[0]!.length).toBe(98)
    expect(rows[1]!.length).toBe(98)
    expect(rows[2]!.endsWith("…")).toBe(true)
    expect(rows.every((r) => r.length <= 100)).toBe(true)
  })

  it("an unbreakable word (a naked url) is hard-broken across rows", () => {
    const rows = agyDescRows(item("x", { context: "u".repeat(140) }), 100)
    expect(rows).toEqual(["u".repeat(100), "u".repeat(40)])
  })

  it("provider multi-line text flows as prose", () => {
    const rows = agyDescRows(item("x", { context: "line one\nline two" }), 100)
    expect(rows).toEqual(["line one line two"])
  })

  it("at tiny widths nothing ever overflows and the cap still holds", () => {
    const rows = agyDescRows(item("x", { context: "alpha ".repeat(50).trim() }), 30)
    expect(rows).toHaveLength(3)
    expect(rows.every((r) => r.length <= 30)).toBe(true)
    expect(rows[2]!.endsWith("…")).toBe(true)
  })

  it("asking for zero rows is refused outright", () => {
    expect(agyDescRows(item("x", { context: "words here" }), 100, 0)).toEqual([])
  })
})

describe("renderAgySnapshot — the statusline decision, pure over injected data", () => {
  const NOW = 1_800_000_000_000
  const DWELL = 20_000
  const alpha = item("alpha", {
    source: "HN",
    time: NOW - 60_000,
    context: "Alpha context sentence.",
    url: "https://example.com/alpha",
  })
  const beta = item("beta", { source: "GH", time: NOW - 120_000 })
  const cache = { items: [alpha, beta], fetchedAt: NOW, summaries: {}, llmUnavailable: true }

  const snap = (over: Partial<AgySnapshot> = {}): AgySnapshot => ({
    cache,
    config: null,
    ticks: 0,
    windowStart: 0,
    dwellMs: DWELL,
    state: { agent_state: "working", terminal_width: 120 },
    now: NOW,
    ...over,
  })
  const texts = (rows: Array<{ text: string; dim: boolean }>): string[] => rows.map((r) => r.text)

  it("a busy render opens the first dwell window and shows the full card: headline, description, link last", () => {
    const out = renderAgySnapshot(snap())
    expect(texts(out.rows)[0]).toContain("alpha")
    expect(texts(out.rows)[0]!.startsWith("▍")).toBe(true)
    expect(texts(out.rows)[0]!.length).toBe(120) // justified to the terminal width
    expect(texts(out.rows)[0]!.endsWith("now")).toBe(true) // meta pins to the right edge
    expect(texts(out.rows)[1]).toBe("Alpha context sentence.")
    expect(texts(out.rows)[2]).toBe("example.com/alpha") // the origin, ALWAYS the last row
    expect(out.rows[0]!.dim).toBe(false)
    expect(out.rows[1]!.dim).toBe(true) // the body reads dimmed
    expect(out.rows[2]!.dim).toBe(false) // the link stays bright to verify the source
    expect(out.rows[2]!.url).toBe("https://example.com/alpha") // the FULL url — the real click target
    expect(out.ticks).toBe(0)
    expect(out.windowStart).toBe(NOW)
  })

  it("every redraw inside the window shows the same card, rows included — no random flicker", () => {
    const a = renderAgySnapshot(snap({ windowStart: NOW, now: NOW + 3_000 }))
    const b = renderAgySnapshot(snap({ windowStart: NOW, now: NOW + 19_000 }))
    expect(b.rows).toEqual(a.rows)
    expect(a.ticks).toBe(0)
  })

  it("after one dwell window the next card appears — exactly like OpenCode's 20s dwell", () => {
    const out = renderAgySnapshot(snap({ windowStart: NOW, now: NOW + DWELL }))
    expect(texts(out.rows).join("\n")).toContain("beta")
    expect(out.ticks).toBe(1)
  })

  it("renders that arrive late (host was busy) still land on the dwell-correct card", () => {
    // AGY redrew 4.6 windows late: the card must be the one for tick 4, and
    // the walk bookkeeping must already sit at 4 — no double-advance later.
    const out = renderAgySnapshot(snap({ windowStart: NOW, now: NOW + 4.6 * DWELL }))
    expect(out.ticks).toBe(4)
    expect(out.windowStart).toBe(NOW + 4 * DWELL)
  })

  it("idle freezes the clock: no rows, nothing advances while the user reads or types", () => {
    const out = renderAgySnapshot(snap({ windowStart: NOW, now: NOW + 5 * DWELL, state: { agent_state: "idle" } }))
    expect(out.rows).toEqual([])
    expect(out.ticks).toBe(0) // unchanged
    expect(out.windowStart).toBe(NOW) // unchanged
  })

  it("no cache yet renders honestly empty", () => {
    expect(renderAgySnapshot(snap({ cache: null })).rows).toEqual([])
  })

  it("a cache without visible items renders honestly empty", () => {
    expect(renderAgySnapshot(snap({ cache: { ...cache, items: [] } })).rows).toEqual([])
  })

  it("the config filter shapes what can rotate", () => {
    const out = renderAgySnapshot(snap({ config: cfg({ hn: false }) }))
    const all = texts(out.rows).join("\n")
    expect(all).toContain("beta")
    expect(all).not.toContain("alpha")
  })

  it("stories on the cache are irrelevant — the AGY card is fed data, not LLM output", () => {
    const withStories = {
      ...cache,
      summaries: { "https://example.com/alpha": { text: "a story never shown by AGY", at: 1 } },
    }
    const out = renderAgySnapshot(snap({ cache: withStories }))
    expect(texts(out.rows).join("\n")).toContain("alpha")
    expect(texts(out.rows).join("\n")).not.toContain("never shown")
  })

  it("the payload width bounds EVERY row — headline, description rows and link alike", () => {
    const long = { ...alpha, context: "z".repeat(400) }
    const out = renderAgySnapshot(
      snap({ cache: { ...cache, items: [long, beta] }, state: { agent_state: "working", terminal_width: 45 } }),
    )
    for (const row of out.rows) expect(row.text.length).toBeLessThanOrEqual(45)
  })

  it("an item without a description skips those rows entirely — no filler", () => {
    const out = renderAgySnapshot(snap({ windowStart: NOW, now: NOW + DWELL })) // beta has no context
    expect(out.rows).toHaveLength(2) // headline + link, nothing padded on
    expect(texts(out.rows)[1]).toBe("example.com/beta")
  })

  it("an item without a usable url skips the link row — no empty placeholder", () => {
    const linkless = { ...beta, url: "" }
    const out = renderAgySnapshot(snap({ cache: { ...cache, items: [linkless] }, windowStart: NOW, now: NOW + DWELL }))
    const head = texts(out.rows)[0]!
    expect(out.rows).toHaveLength(1)
    expect(head.startsWith("▍ [GH] beta")).toBe(true)
    expect(head.endsWith("· now")).toBe(true) // meta justified to the corner
    expect(head.length).toBe(120)
  })

  it("Reddit channel items with R/PROG source ride the pink channel color", () => {
    const redditItem = item("reddit story", { source: "R/PROG", time: NOW - 60_000 })
    const out = renderAgySnapshot(snap({ cache: { ...cache, items: [redditItem] } }))
    expect(out.rows[0]?.parts?.color).toBe("38;5;133")
  })
})

describe("paintAgyRows — the OpenCode news-panel look, decided once in core", () => {
  // Exact ANSI bytes are built from char codes so this test file stays plain ASCII.
  const ESC = String.fromCharCode(27)
  const BEL = String.fromCharCode(7)

  it("the badge rides its OpenCode channel color; the title stays clean; the meta flows muted", () => {
    const row: AgyRow = {
      text: "▍ [HN] Ship spotted · now",
      dim: false,
      parts: { source: "HN", color: "38;5;202", title: "Ship spotted", meta: " · now", pad: 5 },
    }
    expect(paintAgyRows([row])).toEqual([
      `${ESC}[38;5;202m▍ [HN] ${ESC}[0mShip spotted     ${ESC}[2m · now${ESC}[0m`,
    ])
  })

  it("the link is a REAL terminal hyperlink: OSC 8 target = the full url, label muted", () => {
    const row: AgyRow = { text: "example.com/x", dim: false, url: "https://example.com/x" }
    expect(paintAgyRows([row])).toEqual([
      `${ESC}]8;;https://example.com/x${BEL}${ESC}[2mexample.com/x${ESC}[0m${ESC}]8;;${BEL}`,
    ])
  })

  it("the description body flows muted", () => {
    expect(paintAgyRows([{ text: "reading body", dim: true }])).toEqual([`${ESC}[2mreading body${ESC}[0m`])
  })

  it("painted rows add no visible length — stripping the ANSI yields the plain text", () => {
    const strip = (s: string): string =>
      s
        .replace(new RegExp(`${ESC}\\]8;;[^${BEL}${ESC}]*${BEL}`, "g"), "")
        .replace(new RegExp(`${ESC}\\[[0-9;]*m`, "g"), "")
    const rows: AgyRow[] = [
      { text: "▍ [HN] headline", dim: false, parts: { source: "HN", color: "38;5;202", title: "headline", meta: "", pad: 0 } },
      { text: "reading body", dim: true },
      { text: "example.com/x", dim: false, url: "https://example.com/x" },
    ]
    expect(paintAgyRows(rows).map(strip)).toEqual(["▍ [HN] headline", "reading body", "example.com/x"])
  })
})
