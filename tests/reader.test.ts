// Reader tests — the /news panel's own memory: what has already been
// brought to the user (seen) vs what is still waiting in line (upcoming).
//
// The contract defined here:
//   1. Reader-state helpers: immutable marks, honest grouping (seen = a mark
//      exists), 36h pruning matched to the cache's retention window.
//   2. Persistence: atomic save, corrupt/missing files fall back to an empty
//      ledger, no tmp litter left behind.
//   3. The TUI wires it: /news opens the panel, x marks read, 1-4 switch
//      sources, ticker dwell-ends record a glance, the done line counts
//      what is still upcoming.
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  emptyReaderState,
  groupItems,
  itemKey,
  loadReaderState,
  markItem,
  pruneState,
  saveReaderState,
} from "../packages/waitfeed/opencode/reader-state"
import type { FeedItem } from "../packages/waitfeed/core/types"

/** A fixed "now" every test shares, so marks and pruning are exact. */
const NOW = 1_800_000_000_000
const MINUTE = 60_000
const HOUR = 3_600_000

const item = (url: string, time?: number): FeedItem => ({
  id: `hn-${url}`,
  source: "HN",
  title: "two trains collide near toledo spain",
  url,
  time,
})

let dir: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "waitfeed-reader-"))
})

afterAll(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe("reader-state marks", () => {
  it("itemKey trims, lowercases, and falls back to the id", () => {
    expect(itemKey(item("  https://Example.com/A  "))).toBe("https://example.com/a")
    const noUrl: FeedItem = { id: "hn-1", source: "HN", title: "no link here", url: "" }
    expect(itemKey(noUrl)).toBe("hn-1")
  })

  it("markItem records without mutating the input state", () => {
    const state = emptyReaderState()
    const next = markItem(state, "read", "k1", NOW)
    expect(next.read.k1).toBe(NOW)
    expect(state.read.k1).toBeUndefined() // the caller's state is untouched
  })

  it("markItem overwrites an existing mark with the later timestamp", () => {
    let state = markItem(emptyReaderState(), "glanced", "k1", NOW - MINUTE)
    state = markItem(state, "glanced", "k1", NOW)
    expect(state.glanced.k1).toBe(NOW)
  })
})

describe("reader grouping — seen vs upcoming", () => {
  it("unseen items stay in upcoming, in input order (newest first)", () => {
    const items = [item("a", NOW), item("b", NOW - MINUTE), item("c", NOW - 2 * MINUTE)]
    const { seen, upcoming } = groupItems(items, emptyReaderState())
    expect(seen).toEqual([])
    expect(upcoming.map((i) => i.url)).toEqual(["a", "b", "c"])
  })

  it("read and glanced items are seen; neither is in upcoming", () => {
    const items = [item("a"), item("b"), item("c")]
    let state = markItem(emptyReaderState(), "read", "b", NOW - HOUR)
    state = markItem(state, "glanced", "c", NOW - 2 * HOUR)
    const { seen, upcoming } = groupItems(items, state)
    expect(seen.map((i) => i.url)).toEqual(["b", "c"]) // latest mark first
    expect(upcoming.map((i) => i.url)).toEqual(["a"])
  })

  it("an item marked both ways is seen exactly once", () => {
    const items = [item("a")]
    let state = markItem(emptyReaderState(), "glanced", "a", NOW - HOUR)
    state = markItem(state, "read", "a", NOW)
    const { seen, upcoming } = groupItems(items, state)
    expect(seen).toHaveLength(1)
    expect(upcoming).toHaveLength(0)
  })
})

describe("reader-state pruning", () => {
  it("drops marks past the retention window and keeps fresh ones", () => {
    let state = markItem(emptyReaderState(), "read", "fresh", NOW - MINUTE)
    state = markItem(state, "read", "stale", NOW - 37 * HOUR)
    state = markItem(state, "glanced", "also-stale", NOW - 36 * HOUR - 1)
    const pruned = pruneState(state, NOW)
    expect(pruned.read.fresh).toBe(NOW - MINUTE)
    expect(pruned.read.stale).toBeUndefined()
    expect(pruned.glanced["also-stale"]).toBeUndefined()
  })
})

describe("reader-state persistence", () => {
  it("saves atomically, loads back, and leaves no tmp litter", async () => {
    const path = join(dir, "reader-state.json")
    const state = markItem(emptyReaderState(), "read", "k1", NOW)
    await saveReaderState(path, state)
    await expect(loadReaderState(path)).resolves.toEqual(state)
    const leftovers = (await readdir(dir)).filter((f) => f.includes(".tmp"))
    expect(leftovers).toEqual([])
  })

  it("a missing file reads as an empty ledger", async () => {
    await expect(loadReaderState(join(dir, "nope.json"))).resolves.toEqual(emptyReaderState())
  })

  it("a corrupt file reads as an empty ledger instead of crashing", async () => {
    const path = join(dir, "broken.json")
    await writeFile(path, "{ this is not json", "utf8")
    await expect(loadReaderState(path)).resolves.toEqual(emptyReaderState())
  })
})

describe("the OpenCode reader wires the ledger to the native popup (source contract)", () => {
  const tui = async (): Promise<string> =>
    readFile(join(import.meta.dirname, "..", "packages", "waitfeed", "opencode", "tui.tsx"), "utf8")

  it("/news opens the native OpenCode popup (never a custom panel)", async () => {
    const src = await tui()
    expect(src).toContain("context.ui.dialog.select<string>({")
    expect(src).not.toContain("context.ui.panel.open(")
    expect(src).not.toContain("NewsPanel")
    expect(src).not.toContain("session.panel")
  })

  it("the [Sources] row opens the toggle menu; toggling works by selection only, no key pressing", async () => {
    const src = await tui()
    expect(src).toContain("__toggle_feeds__")
    expect(src).toContain("openFeedToggleMenu(")
    expect(src).toContain("← Back to News Reader")
    for (const forbidden of ["keymap.mode.push", 'bind: "x"', 'bind: "1"', 'bind: "f"', "keyInput"]) {
      expect(src, `reader must not touch keys: ${forbidden}`).not.toContain(forbidden)
    }
  })

  it("sections are native category headers — the host draws them with a gap above", async () => {
    const src = await tui()
    expect(src).toContain("category: seenCategory")
    expect(src).toContain("category: upcomingCategory")
    expect(src).toContain("SEEN — already brought to you (")
    expect(src).toContain("UPCOMING — new to you (")
    for (const fake of ["__gap__", "__seen__", "__upcoming__"]) {
      expect(src, `fake section rows must be gone: ${fake}`).not.toContain(fake)
    }
  })

  it("descriptions stay body-only; the width comes from the dialog's own presentation knob", async () => {
    const src = await tui()
    expect(src).not.toContain("`> ${it.url}`") // the link opens on Enter — never glued into the row text
    expect(src).toContain("Type to search headlines or sources (hn, gh, dev, reddit)...")
    // size lives on the ACTIVE dialog, never inside select() args (the host
    // ignores hints there), and never applied late — late re-measures clip.
    expect(src).toContain(`context.ui.dialog.set({ size: "xlarge" })`)
    expect(src, "select() args never take size — no spread hint").not.toContain("...({ size:")
    expect(src).not.toContain("}, 10)")
    expect(src).not.toContain("}, 50)")
  })

  it("the ticker dwell still records a glance; the done line still counts upcoming", async () => {
    const src = await tui()
    expect(src).toContain("markGlanced(")
    expect(src).toContain("new in /news")
  })

  it("news rows never print the auto bookkeeping label (glanced) — it ate headline width", async () => {
    const src = await tui()
    expect(src).not.toContain("`glanced ${formatAgo(glanceAt)}`")
    expect(src, "glanceAt stays ledger-only — not a row label").not.toContain("const glanceAt")
    expect(src, "your own opened items keep the read time").toContain("`read ${formatAgo(readAt)}`")
  })
})
