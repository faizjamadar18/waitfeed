// Pipeline tests — the host-neutral data cycle every WaitFeed host shares
// (OpenCode server plugin today, the Antigravity CLI scheduler next).
//
// The contract defined here:
//   1. fetch channels → dedupe/merge newest-first → retain recent items →
//      enrich descriptions → drop junk → write cache.json.
//   2. STORY hosts (OpenCode) inject a story writer: the LLM layer re-probes
//      every fresh cycle (llmUnavailable resets to false), enrichment stops
//      the moment the story target is met, and stories save incrementally.
//   3. HEADLINE hosts (AGY) inject nothing: the cache is pinned to headline
//      mode (llmUnavailable=true) and enrichment runs at its own budget.
//   4. Everything survives a dead channel, a corrupt cache file, concurrent
//      invocations (cycle lock) — and unknown cache keys (like OpenCode's
//      digestSessionID) never get dropped.
//
// Fixture note: titles are deliberately multi-word. The junk filter (by
// design) drops unreadable single-token headlines, so one-word fake titles
// would all vanish and mask the behavior these tests actually pin.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  runPipeline,
  writeCacheDoc,
  STORY_TARGET,
  type CacheFile,
  type PipelineDeps,
} from "../packages/waitfeed/core/pipeline"
import { DEFAULT_CONFIG, type WaitFeedConfig } from "../packages/waitfeed/core/config"
import type { FeedItem } from "../packages/waitfeed/core/types"
import { isStoryable } from "../packages/waitfeed/core/llm"

const HOUR = 3_600_000
/** A fixed "now" every test shares — the fixtures are written against it. */
const BASE = 1_800_000_000_000

let dir: string
let cachePath: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "waitfeed-pipeline-"))
  cachePath = join(dir, "cache.json")
})

afterAll(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

/** Every test starts from a stale-but-valid cache, so a full cycle always
 * runs — tests that seed richer state overwrite this first, and tests that
 * pin the fresh-skip rule write their own fresh cache before running. */
beforeEach(async () => {
  await writeCacheDoc(cachePath, {
    items: [],
    fetchedAt: BASE - 2 * HOUR,
    summaries: {},
    llmUnavailable: false,
  })
})

/** Deterministic test item factory — ids and urls derive from the title. */
function item(title: string, over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: `hn-${title}`,
    source: "HN",
    title,
    url: `https://example.com/${title.toLowerCase().replace(/\s+/g, "-")}`,
    ...over,
  }
}

/** Counting fetch fake: records invocations, returns canned groups. */
function fetchOnce(groups: FeedItem[][]) {
  let times = 0
  return {
    run: async () => {
      times++
      return { groups, status: groups.map((g, i) => ({ name: `ch-${i}`, count: g.length })) }
    },
    times: () => times,
  }
}

function makeDeps(over: Partial<PipelineDeps> = {}): PipelineDeps {
  return {
    cachePath,
    loadConfig: async (): Promise<WaitFeedConfig> => ({
      ...DEFAULT_CONFIG,
      sources: { ...DEFAULT_CONFIG.sources },
      rssUrls: [],
    }),
    fetchFeeds: async () => ({ groups: [], status: [] }),
    enrich: makeEnrich().run,
    now: () => BASE,
    ...over,
  }
}

/** Enrichment fake that honors the same options the real one does. Contexts
 * are long enough (≥ DESCRIPTION_MIN = 80) that isStoryable passes, which is
 * exactly what the real enrich works toward for story hosts. Records the
 * item ids each call received, so tests can pin that enrichment never sees
 * items that must die on arrival. */
function makeEnrich() {
  const calls: Array<{ items: string[]; slotsLeft?: () => number; maxFetch?: number; capturedSlots: number | null }> = []
  const run: PipelineDeps["enrich"] = async (items, opts) => {
    calls.push({
      items: items.map((it) => it.id),
      slotsLeft: opts?.slotsLeft,
      maxFetch: opts?.maxFetch,
      capturedSlots: opts?.slotsLeft ? opts.slotsLeft() : null,
    })
    let filled = 0
    for (const it of items) {
      if (opts?.maxFetch !== undefined && filled >= opts.maxFetch) break
      if (opts?.slotsLeft && opts.slotsLeft() <= 0) break
      if (!it.context) {
        it.context = `meta description for item ${it.title}: a richly detailed background story that sails far beyond the eighty character minimum`
        filled++
      }
    }
    return filled
  }
  return { run, calls }
}

/** Story writer fake: one summary per storyable item, saved incrementally. */
function makeWriter(): PipelineDeps["writeStories"] {
  return async (cache, items, io) => {
    for (const it of items) {
      if (isStoryable(it) && !cache.summaries[it.url]) {
        cache.summaries[it.url] = { text: `story of ${it.title}`, at: 1 }
      }
    }
    await io.saveCache()
  }
}

async function readWritten(): Promise<CacheFile> {
  return JSON.parse(await readFile(cachePath, "utf8")) as CacheFile
}

describe("runPipeline — story hosts (OpenCode)", () => {
  it("fetch → dedupe → enrich → junk-drop → cache with stories and llmUnavailable=false", async () => {
    const mk = item("First big story lands", { time: BASE - 1000, url: "https://example.com/first-big" })
    const fresh = fetchOnce([
      [
        mk,
        item("First big story lands", { time: BASE - 1000, source: "GH", url: mk.url }), // same URL → dedupe
        item("Second story follows", { time: BASE - 5000 }),
        item("]]]junk[[[", { time: BASE - 2000 }), // unreadable junk title, dropped
        item("Carry older items", { time: BASE - 8000 }),
      ],
    ])
    await runPipeline(makeDeps({ fetchFeeds: fresh.run, writeStories: makeWriter() }))
    const written = await readWritten()
    expect(written.fetchedAt).toBe(BASE)
    expect(written.llmUnavailable).toBe(false)
    expect(written.items.map((i) => i.title)).toEqual([
      "First big story lands", // newest first
      "Second story follows",
      "Carry older items",
    ]) // junk gone, no dupes
    for (const it of written.items) expect(it.context).toMatch(/^meta description/)
    expect(written.summaries["https://example.com/first-big"]).toEqual({ text: "story of First big story lands", at: 1 })
  })

  it("once the story target is met, the enricher receives a zero-slot check", async () => {
    const { run: enrich, calls } = makeEnrich()
    // Story target already reached BEFORE enrichment: 60 items that are
    // storyable (long real context) AND carry a story. The enricher must
    // see slotsLeft() === 0 — the real one spends zero page visits then.
    const prev = Array.from({ length: 60 }, (_, i) =>
      item(`seeded ready item ${i}`, { time: BASE - (i + 1) * 1000, context: "x".repeat(100) }),
    )
    const cache: CacheFile = {
      items: prev,
      fetchedAt: BASE - 2 * HOUR,
      summaries: {},
      llmUnavailable: false,
    }
    for (const it of prev) cache.summaries[it.url] = { text: "s", at: 1 }
    await writeCacheDoc(cachePath, cache)
    await runPipeline(
      makeDeps({ fetchFeeds: fetchOnce([[item("extra fresh item")]]).run, enrich, writeStories: makeWriter() }),
    )
    expect(STORY_TARGET).toBe(60)
    expect(calls[0]?.capturedSlots).toBe(0)
  })

  it("the expandable slots check is handed to the enricher, not defaulted", async () => {
    const { run: enrich, calls } = makeEnrich()
    // Fewer story-ready items than the target → the enricher must receive a
    // slotsLeft function (the dynamic stop-at-target rule), never maxFetch.
    await runPipeline(
      makeDeps({
        fetchFeeds: fetchOnce([[item("some fresh item")]]).run,
        enrich,
        writeStories: makeWriter(),
      }),
    )
    expect(calls[0]?.slotsLeft).toBeTypeOf("function")
    expect(calls[0]?.maxFetch).toBeUndefined()
  })

  it("re-probes the LLM layer: a seeded llmUnavailable resets to false on a fresh cycle", async () => {
    await writeCacheDoc(cachePath, {
      items: [item("Stale old item")],
      fetchedAt: BASE - 2 * HOUR,
      summaries: {},
      llmUnavailable: true,
    })
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([[item("Brand new item")]]).run, writeStories: makeWriter() }))
    expect((await readWritten()).llmUnavailable).toBe(false)
  })

  it("retention: recent items keep their stories; fresh data wins on the same url", async () => {
    const carried = item("Carried over item", { time: BASE - 1000, url: "https://example.com/carried" })
    await writeCacheDoc(cachePath, {
      items: [carried, item("Ancient expired item", { time: BASE - 40 * HOUR })],
      fetchedAt: BASE - 2 * HOUR,
      summaries: { [carried.url]: { text: "still good", at: 1 } },
      llmUnavailable: false,
    })
    const refreshed = item("Carried over item", { time: BASE, url: carried.url, source: "GH" })
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([[refreshed]]).run, writeStories: makeWriter() }))
    const written = await readWritten()
    expect(written.items.map((i) => i.title)).toEqual(["Carried over item"]) // fresh copy replaced the old one
    expect(written.summaries[carried.url]?.text).toBe("still good")
  })

  it("a writer gate (llmUnavailable set during stories) is preserved verbatim", async () => {
    await runPipeline(
      makeDeps({
        fetchFeeds: fetchOnce([[item("Gated story item")]]).run,
        writeStories: async (cache, _items, io) => {
          cache.llmUnavailable = true
          await io.saveCache()
        },
      }),
    )
    expect((await readWritten()).llmUnavailable).toBe(true)
  })

  it("the writer can hand its own extra keys through its save (a new digest session)", async () => {
    await runPipeline(
      makeDeps({
        fetchFeeds: fetchOnce([[item("Patched extra item")]]).run,
        writeStories: async (_cache, _items, io) => {
          await io.saveCache({ digestSessionID: "ses_new" })
        },
      }),
    )
    const raw = JSON.parse(await readFile(cachePath, "utf8")) as Record<string, unknown>
    expect(raw.digestSessionID).toBe("ses_new")
  })
})

describe("runPipeline — headline hosts (Antigravity, no story writer)", () => {
  it("pins headline mode: llmUnavailable stays true and no new stories appear", async () => {
    const carried = item("Carried old item", { time: BASE - 1000, url: "https://example.com/carried-old" })
    await writeCacheDoc(cachePath, {
      items: [carried],
      fetchedAt: BASE - 2 * HOUR,
      summaries: { [carried.url]: { text: "old story", at: 1 } },
      llmUnavailable: false,
    })
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([[item("Fresh new item")]]).run }))
    const written = await readWritten()
    expect(written.llmUnavailable).toBe(true)
    expect(written.summaries[carried.url]).toEqual({ text: "old story", at: 1 }) // kept
    expect(written.summaries["https://example.com/fresh-new-item"]).toBeUndefined() // never added
  })

  it("enrichment runs at its own budget — without the story-stop option", async () => {
    const { run: enrich, calls } = makeEnrich()
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([[item("New fresh item")]]).run, enrich }))
    expect(calls[0]).toBeTruthy()
    expect(calls[0]?.slotsLeft).toBeUndefined()
  })

  it("enrichment without a writer is capped by its per-cycle page budget", async () => {
    const { run: enrich, calls } = makeEnrich()
    const many = Array.from({ length: 50 }, (_, i) => item(`fetched wide item ${i}`, { time: BASE - i }))
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([many]).run, enrich }))
    expect(calls[0]?.maxFetch).toBe(24)
  })
})

describe("runPipeline — shared mechanics", () => {
  it("fetches nothing while the cache is fresh", async () => {
    await writeCacheDoc(cachePath, {
      items: [item("Warm cached item")],
      fetchedAt: BASE - 1000,
      summaries: {},
      llmUnavailable: false,
    })
    const fresh = fetchOnce([[item("Not fetched item")]])
    await runPipeline(makeDeps({ fetchFeeds: fresh.run }))
    expect(fresh.times()).toBe(0)
    const written = await readWritten()
    expect(written.items.map((i) => i.title)).toEqual(["Warm cached item"])
    expect(written.fetchedAt).toBe(BASE - 1000)
  })

  it("retention: expired items drop, items with unknown time survive", async () => {
    await writeCacheDoc(cachePath, {
      items: [item("Ancient expired item", { time: BASE - 40 * HOUR }), item("No time unknown")],
      fetchedAt: BASE - 2 * HOUR,
      summaries: {},
      llmUnavailable: false,
    })
    await runPipeline(
      makeDeps({ fetchFeeds: fetchOnce([[item("Brand new item")]]).run, writeStories: makeWriter() }),
    )
    const titles = (await readWritten()).items.map((i) => i.title)
    expect(titles).toContain("Brand new item")
    expect(titles).toContain("No time unknown")
    expect(titles).not.toContain("Ancient expired item")
  })

  it("serializes concurrent cycles through the cycle lock", async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
    })
    let invocations = 0
    const slowFetch: PipelineDeps["fetchFeeds"] = async () => {
      invocations++
      await gate
      return { groups: [[item("Slow blocked cycle")]], status: [] }
    }
    const deps = makeDeps({ fetchFeeds: slowFetch, writeStories: makeWriter() })
    const a = runPipeline(deps)
    await new Promise((r) => setTimeout(r, 30)) // A takes the lock
    const b = runPipeline(deps)
    await new Promise((r) => setTimeout(r, 30)) // B must be blocked by it
    release()
    await Promise.all([a, b])
    expect(invocations).toBe(1)
  })

  it("steals a stale lock file left behind by a dead run", async () => {
    const later = 2_000_000_000_000
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, "cycle.lock"), `${later - 2 * HOUR}`, "utf8")
    const fresh = fetchOnce([[item("Lock steal item", { time: later })]])
    await runPipeline(makeDeps({ fetchFeeds: fresh.run, now: () => later }))
    expect(fresh.times()).toBe(1)
  })

  it("a dying fetch never destroys the standing cache and releases the lock", async () => {
    await writeCacheDoc(cachePath, {
      items: [item("Standing untouched item")],
      fetchedAt: BASE - 2 * HOUR,
      summaries: {},
      llmUnavailable: false,
    })
    await runPipeline(
      makeDeps({
        fetchFeeds: async () => {
          throw new Error("network dead")
        },
      }),
    )
    expect((await readWritten()).items.map((i) => i.title)).toEqual(["Standing untouched item"]) // untouched
    const replay = fetchOnce([[item("Recovered later item", { time: BASE })]])
    await runPipeline(makeDeps({ fetchFeeds: replay.run, writeStories: makeWriter() }))
    expect(replay.times()).toBe(1) // lock was released
  })

  it("passes the exact config (sources + rss urls) to the fetcher", async () => {
    let seenSources: Record<string, unknown> | undefined
    let seenRss: string[] | undefined
    const cfg: WaitFeedConfig = {
      ...DEFAULT_CONFIG,
      sources: { ...DEFAULT_CONFIG.sources, hn: false },
      rssUrls: ["https://example.com/feed.rss"],
    }
    await runPipeline(
      makeDeps({
        loadConfig: async () => cfg,
        fetchFeeds: async (sources, rssUrls) => {
          seenSources = sources
          seenRss = rssUrls
          return { groups: [], status: [] }
        },
      }),
    )
    expect(seenSources).toEqual(cfg.sources)
    expect(seenSources?.hn).toBe(false)
    expect(seenRss).toEqual(["https://example.com/feed.rss"])
  })

  it("caps the list to maxItems, keeping the newest", async () => {
    const many = Array.from({ length: 8 }, (_, i) => item(`story number ${i}`, { time: BASE - i * 1000 }))
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([many]).run, writeStories: makeWriter(), maxItems: 5 }))
    const written = await readWritten()
    expect(written.items).toHaveLength(5)
    expect(written.items.map((i) => i.title)).toEqual(["story number 0", "story number 1", "story number 2", "story number 3", "story number 4"])
  })

  it("unknown cache keys (digestSessionID) survive the whole cycle untouched", async () => {
    await writeCacheDoc(
      cachePath,
      {
        items: [item("Old seeded item")],
        fetchedAt: BASE - 2 * HOUR,
        summaries: {},
        llmUnavailable: false,
      },
      { digestSessionID: "ses_digest" },
    )
    await runPipeline(
      makeDeps({ fetchFeeds: fetchOnce([[item("Brand new item")]]).run, writeStories: makeWriter() }),
    )
    const raw = JSON.parse(await readFile(cachePath, "utf8")) as Record<string, unknown>
    expect(raw.digestSessionID).toBe("ses_digest")
  })

  it("a corrupt cache file falls back to defaults and the cycle still runs", async () => {
    await writeFile(cachePath, "{not json at all", "utf8")
    await runPipeline(
      makeDeps({ fetchFeeds: fetchOnce([[item("Post corruption recovery")]]).run, writeStories: makeWriter() }),
    )
    expect((await readWritten()).items.map((i) => i.title)).toEqual(["Post corruption recovery"])
  })

  it("an empty fetch still refreshes fetchedAt so the store stays honest", async () => {
    // An old, empty cache guarantees the cycle is not skipped as fresh.
    await writeCacheDoc(cachePath, {
      items: [],
      fetchedAt: BASE - 2 * HOUR,
      summaries: {},
      llmUnavailable: false,
    })
    await runPipeline(makeDeps({ fetchFeeds: async () => ({ groups: [], status: [] }), writeStories: makeWriter() }))
    const written = await readWritten()
    expect(written.fetchedAt).toBe(BASE)
    expect(written.items).toEqual([])
  })
})

describe("English-only ingestion", () => {
  it("foreign items never enrich and never cache — even when they rode in an older cache", async () => {
    // Both leak shapes observed on the live reader: a repo line whose context
    // is entirely another script, and English text ending in foreign glyphs.
    // The saved one also pins the pruning of items already in the cache.
    const savedForeign = item("rddmwddr/android-ad-cleaner", {
      context: "卸掉国产安卓手机系统里的广告、热搜、资讯推荐和营销",
      url: "https://github.com/rddmwddr/android-ad-cleaner",
    })
    const freshForeign = item("smithjohn/tonjiang-lab", {
      context: "Free interactive 3D science lessons for high school 铜匠实验",
      url: "https://github.com/smithjohn/tonjiang-lab",
    })
    const english = item("A faster way to compute signed 64-bit floor division")
    await writeCacheDoc(cachePath, {
      items: [savedForeign, english],
      fetchedAt: BASE - 2 * HOUR,
      summaries: {},
      llmUnavailable: false,
    })
    const enrich = makeEnrich()
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([[freshForeign]]).run, enrich: enrich.run }))

    const written = await readWritten()
    const ids = written.items.map((it) => it.id)
    expect(ids).not.toContain(savedForeign.id)
    expect(ids).not.toContain(freshForeign.id)
    expect(ids).toContain(english.id)
    // the expensive layers never touch what dies on arrival
    expect(enrich.calls.length).toBeGreaterThan(0)
    const seen = enrich.calls.flatMap((call) => call.items)
    expect(seen).not.toContain(savedForeign.id)
    expect(seen).not.toContain(freshForeign.id)
  })

  it("foreign titles in other scripts die too, English with accents survives", async () => {
    const cyrillic = item("Привет мир from the systems feed")
    const korean = item("한국 개발자 시스템 정리")
    const accented = item("The café test — how Müller ships code")
    await runPipeline(makeDeps({ fetchFeeds: fetchOnce([[cyrillic, korean, accented]]).run }))
    const titles = (await readWritten()).items.map((it) => it.title)
    expect(titles).toEqual([accented.title])
  })
})
