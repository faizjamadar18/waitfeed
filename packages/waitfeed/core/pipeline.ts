// WaitFeed data pipeline — the host-neutral news cycle every WaitFeed host
// shares. OpenCode's server plugin and the Antigravity CLI scheduler both
// run THIS cycle; they differ only in the injected story-writer hook:
//
//   fetch channels → dedupe/merge newest-first → carry recent items →
//   enrich descriptions → drop junk → write cache.json → story phase?
//
// STORY hosts (OpenCode) inject writeStories: the LLM layer re-probes every
// cycle (llmUnavailable resets to false), enrichment stops the moment the
// story target is met, and the writer saves incrementally.
//
// HEADLINE hosts (Antigravity) inject nothing: the cache is pinned to
// headline mode (llmUnavailable stays true) and enrichment runs at its own
// per-cycle budget. AGY plugins have no LLM API (verified against the
// official docs 2026-10-25) — the port adds zero API keys.
//
// All I/O is injectable or parameterized so tests run real cycles against a
// temp directory with zero network.
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises"
import { appendFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import type { ChannelKey, WaitFeedConfig } from "./config"
import type { EnrichOptions } from "./enrich"
import type { FetchAllResult } from "./feeds"
import { isStoryable } from "./llm"
import { dropJunk, dropNonEnglish, mergeItems, retainMerge } from "./ticker"
import type { FeedItem } from "./types"

/** How long a fresh cache suppresses fetching: 30 minutes per feed cycle. */
const REFRESH_MS_DEFAULT = 30 * 60 * 1000
/** Cache cap: previous items survive refresh cycles (retainMerge) until here. */
const CACHE_ITEMS_DEFAULT = 90
/** Retention window: dead channels or LLM hiccups never empty the ticker. */
const RETAIN_TTL_MS = 36 * 60 * 60 * 1000
/** Page-visit budget for enrichment on headline hosts (story hosts stop at
 * the target instead). */
const ENRICH_PER_CYCLE = 24
/** Runtime story target — story hosts stop enriching the moment this many
 * story-complete cards exist (the visible pool for the rotating ticker). */
export const STORY_TARGET = 60
/** A stale cycle lock older than this is stolen by a live run. */
const LOCK_TTL_MS = 10 * 60 * 1000

export interface CacheFile {
  items: FeedItem[]
  fetchedAt: number
  /** LLM story per item URL, grown over refresh cycles (story hosts only). */
  summaries: Record<string, { text: string; at: number }>
  /** Story hosts: true when generation is unavailable → whole-view headline
   * mode. Headline hosts: pinned true. */
  llmUnavailable: boolean
}

/** What the story writer gets to persist incremental story writes. A small
 * patch lets a host carry ITS private keys (a freshly created digest session
 * id) into the shared document without dropping anything of other hosts'. */
export interface CacheIo {
  saveCache(patch?: Record<string, unknown>): Promise<void>
}

export type StoryWriter = (cache: CacheFile, items: FeedItem[], io: CacheIo) => Promise<void>

export interface PipelineDeps {
  /** Absolute path of the shared cache document. */
  cachePath: string
  loadConfig: () => Promise<WaitFeedConfig>
  fetchFeeds: (
    sources: Partial<Record<ChannelKey, boolean>>,
    rssUrls: string[],
  ) => Promise<FetchAllResult>
  enrich: (
    items: FeedItem[],
    opts?: EnrichOptions,
  ) => Promise<number>
  /** Omit on headline-only hosts (Antigravity). */
  writeStories?: StoryWriter
  /** Injectable clock (tests). */
  now?: () => number
  /** Injectable refresh window (tests). */
  refreshMs?: number
  /** Injectable cache cap (tests). */
  maxItems?: number
  /** Diagnostics sink — one line per cycle event. */
  log?: (line: string) => void
}

export const emptyCache = (): CacheFile => ({
  items: [],
  fetchedAt: 0,
  summaries: {},
  llmUnavailable: true,
})

/**
 * Read the shared cache document. Throws on a missing/corrupt file — callers
 * that want a best-effort default must catch. Unknown keys are preserved and
 * handed back so a host's private fields (OpenCode's digestSessionID) never
 * get dropped by a shared rewrite.
 */
export async function readCacheDoc(path: string): Promise<{ cache: CacheFile; extra: Record<string, unknown> }> {
  const parsed = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>
  const cache: CacheFile = {
    items: Array.isArray(parsed.items) ? (parsed.items as FeedItem[]) : [],
    fetchedAt: typeof parsed.fetchedAt === "number" ? parsed.fetchedAt : 0,
    summaries:
      parsed.summaries && typeof parsed.summaries === "object"
        ? (parsed.summaries as CacheFile["summaries"])
        : {},
    llmUnavailable: parsed.llmUnavailable === true,
  }
  const extra: Record<string, unknown> = { ...parsed }
  delete extra.items
  delete extra.fetchedAt
  delete extra.summaries
  delete extra.llmUnavailable
  return { cache, extra }
}

/** Atomic (tmp + rename) write of the shared cache document. */
export async function writeCacheDoc(path: string, cache: CacheFile, extra: Record<string, unknown> = {}): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.${Date.now()}.tmp`
  await writeFile(tmp, JSON.stringify({ ...extra, ...cache }, null, 2), "utf8")
  await rename(tmp, path)
}

async function acquireLock(path: string, nowMs: number): Promise<boolean> {
  try {
    const content = await readFile(path, "utf8").catch(() => "")
    if (content) {
      const ts = Number(content.trim())
      if (Number.isFinite(ts) && nowMs - ts < LOCK_TTL_MS) return false // someone is working
      await writeFile(path, `${nowMs}`, "utf8") // stale lock — steal it
      return true
    }
    await writeFile(path, `${nowMs}`, { encoding: "utf8", flag: "wx" })
    return true
  } catch {
    return false // exists → someone is working
  }
}

/** How many on-screen-eligible items are story-complete right now. Items
 * without a usable description are permanently plain and never count. */
export function storyReady(cache: CacheFile, items: FeedItem[]): number {
  return items.filter((it) => isStoryable(it) && !!cache.summaries[it.url]?.text).length
}

/**
 * One shared data cycle. Never throws — a failed cycle logs and leaves the
 * standing cache untouched, and the cycle lock is always released.
 */
export async function runPipeline(deps: PipelineDeps): Promise<void> {
  const now = deps.now ?? (() => Date.now())
  const refreshMs = deps.refreshMs ?? REFRESH_MS_DEFAULT
  const maxItems = deps.maxItems ?? CACHE_ITEMS_DEFAULT
  const log = deps.log ?? (() => {})
  const lockPath = join(dirname(deps.cachePath), "cycle.lock")
  let held = false
  try {
    held = await acquireLock(lockPath, now())
    if (!held) return
    let cache: CacheFile
    let extra: Record<string, unknown>
    try {
      ({ cache, extra } = await readCacheDoc(deps.cachePath))
    } catch {
      cache = emptyCache()
      extra = {}
    }
    // Config re-read every cycle: reader toggles apply at the next fetch
    // without any restart, and disabled channels are never contacted.
    const cfg = await deps.loadConfig()
    if (cache.items.length > 0 && now() - cache.fetchedAt < refreshMs) {
      log(`cycle: fresh skip (age ${Math.round((now() - cache.fetchedAt) / 1000)}s)`)
      return
    }
    // Story hosts re-probe the LLM layer on every fresh cycle; headline
    // hosts (no writer) are structurally locked to headline mode.
    cache.llmUnavailable = !deps.writeStories

    const { groups, status } = await deps.fetchFeeds(cfg.sources, cfg.rssUrls)
    const fetched = mergeItems(groups, maxItems)
    // English-only, cheapest-first: right after the merge, BEFORE enrich —
    // foreign items (fresh or already saved in the cache) cost no digest
    // work and reach no host. See ticker.dropNonEnglish.
    const merged = dropNonEnglish(
      retainMerge(cache.items, fetched, { ttlMs: RETAIN_TTL_MS, cap: maxItems, now: now() }),
    )
    if (deps.writeStories) {
      // Story mode shows ONLY story-complete items, so enrichment keeps a
      // live check: it must not spend page visits past the visible target.
      await deps.enrich(merged, { slotsLeft: () => STORY_TARGET - storyReady(cache, merged) })
    } else {
      await deps.enrich(merged, { maxFetch: ENRICH_PER_CYCLE })
    }
    const items = dropJunk(merged)
    const channelLine = status
      .map((s) => `${s.name} ${s.count}${s.error ? ` (FAILED: ${s.error})` : ""}`)
      .join(" · ")
    log(
      `pipeline: ${items.length} in play · ${channelLine || "no channel returned"} · ` +
        `${storyReady(cache, items)} stories ready of ${STORY_TARGET}`,
    )
    cache.items = items
    cache.fetchedAt = now()
    const save = (patch: Record<string, unknown> = {}): Promise<void> =>
      writeCacheDoc(deps.cachePath, cache, { ...extra, ...patch })
    await save() // headline data lands now; the host reveals items as stories arrive

    if (deps.writeStories) {
      await deps.writeStories(cache, items, { saveCache: save })
    }
  } catch (err) {
    log(`cycle FAILED: ${(err as Error)?.message ?? String(err)}`)
  } finally {
    if (held) await unlink(lockPath).catch(() => {})
  }
}

/** Best-effort diagnostics log shareable by every host (probe.log). */
export function makeProbeLog(dataDir: string): (line: string) => Promise<void> {
  const file = join(dataDir, "probe.log")
  return async (line: string): Promise<void> => {
    try {
      const size = await stat(file).then((s) => s.size).catch(() => 0)
      if (size > 100_000) await writeFile(file, "", "utf8")
      await appendFile(file, `${new Date().toISOString()} ${line}\n`, "utf8").catch(() => {})
    } catch {
      // diagnostics must never break the plugin
    }
  }
}
