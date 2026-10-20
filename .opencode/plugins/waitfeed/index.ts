// WaitFeed — server-side plugin. Owns the data pipeline and writes the shared
// cache file the TUI reads:
//
//   fetch channels → merge → enrich (meta descriptions) → drop junk →
//   write cache (headline data lands immediately; the TUI reveals an item once
//   its story is ready, or shows everything as headlines when the LLM layer is
//   off) → LLM stories (one-glance digest, ≤180 chars, via a dedicated digest
//   session and ctx.session.generate — the session pipeline the free tier
//   allows, with retries for the flaky upstream) → incremental cache write
//   after each story
//
// Refresh every 30 minutes; the TUI polls the file, so no cross-process
// messaging is needed. Zero keys, zero cloud.
import { Plugin } from "@opencode/plugin"
import { appendFile, mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "./core/config"
import { enrichMissing } from "./core/enrich"
import { fetchAllFeeds } from "./core/feeds"
import { buildStoryPrompt, cleanStory, isFreeTierGate } from "./core/llm"
import { gitTips } from "./core/tip"
import { dropJunk, mergeItems } from "./core/ticker"
import type { FeedItem } from "./core/types"

interface CacheFile {
  items: FeedItem[]
  fetchedAt: number
  /** LLM story per item URL, grown over refresh cycles. */
  summaries: Record<string, { text: string; at: number }>
  /** Set when the gate refuses generation; re-probed next cycle. */
  llmUnavailable: boolean
  /** Dedicated session reused for all story generations. */
  digestSessionID?: string
  /** Personal "▍ YOU" lines from local git metadata, per cycle. */
  tips?: string[]
}

const REFRESH_MS = 30 * 60 * 1000
/** Stories per refresh cycle, newest headlines first — the TUI shows an item
 * only once its story is ready, so fresh news needs coverage quickly. After
 * the backlog is covered this only spends on genuinely new headlines. */
const SUMMARY_BUDGET = 8
/** Soft cap for the story phase so the cycle lock never outlives its TTL;
 * anything left over is picked up next cycle. */
const SUMMARY_TIME_BUDGET_MS = 8 * 60 * 1000
const GENERATE_TIMEOUT_MS = 90_000
/** Upstream generation is flaky ("Endpoint is unavailable") — bounded retries. */
const GENERATE_RETRIES = 3
const CACHE_ITEMS = 40
/** Re-running setup in the same shared service process leaves old timers; a
 * module-level counter tells us how many times the host re-ran setup. */
let ALIVE_SETUPS = 0

function dataDir(): string {
  return join(homedir(), ".config", "waitfeed")
}
function cachePath(): string {
  return join(dataDir(), "cache.json")
}

const LOCK_TTL_MS = 10 * 60 * 1000
/** Cross-callback mutex: the host may run setup once per session, so several
 * closures keep interval timers; the lock serializes expensive cycle work. */
async function acquireLock(): Promise<boolean> {
  const path = join(dataDir(), "cycle.lock")
  try {
    const content = await readFile(path, "utf8").catch(() => "")
    if (content) {
      const ts = Number(content.trim())
      if (Number.isFinite(ts) && Date.now() - ts < LOCK_TTL_MS) return false // someone is working
      await writeFile(path, `${Date.now()}`, "utf8") // stale lock — steal it
      return true
    }
    await writeFile(path, `${Date.now()}`, { encoding: "utf8", flag: "wx" })
    return true
  } catch {
    return false // exists → someone is working
  }
}
async function releaseLock(): Promise<void> {
  await unlink(join(dataDir(), "cycle.lock")).catch(() => {})
}

/** Diagnostics log for the generation path. */
async function probeLog(line: string): Promise<void> {
  try {
    const file = join(dataDir(), "probe.log")
    const size = await stat(file).then((s) => s.size).catch(() => 0)
    if (size > 100_000) await writeFile(file, "", "utf8")
    await appendFile(`${file}`, `${new Date().toISOString()} ${line}\n`, "utf8").catch(() => {})
  } catch {
    // diagnostics must never break the plugin
  }
}

async function readCache(): Promise<CacheFile> {
  try {
    const parsed = JSON.parse(await readFile(cachePath(), "utf8")) as Partial<CacheFile>
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      fetchedAt: typeof parsed.fetchedAt === "number" ? parsed.fetchedAt : 0,
      summaries: parsed.summaries && typeof parsed.summaries === "object" ? parsed.summaries : {},
      llmUnavailable: parsed.llmUnavailable === true,
      digestSessionID: typeof parsed.digestSessionID === "string" ? parsed.digestSessionID : undefined,
    }
  } catch {
    return { items: [], fetchedAt: 0, summaries: {}, llmUnavailable: false }
  }
}

export default Plugin.define({
  id: "waitfeed",
  async setup(ctx) {
    void probeLog(`SETUP START pid=${process.pid} slot=${++ALIVE_SETUPS}`)
    let running = false
    /** The digest session ID, seeded from the cache file once per load. */
    let digestID: string | undefined
    let digestFlight: Promise<string | undefined> | null = null

    /** Reads + merges the file, always carrying the session ID we know. */
    const writeCache = async (cache: CacheFile): Promise<void> => {
      await mkdir(dataDir(), { recursive: true })
      // Unique tmp name: the setup probe and a cycle can write concurrently.
      const tmp = `${cachePath()}.${Date.now()}.tmp`
      await writeFile(tmp, JSON.stringify({ ...cache, digestSessionID: digestID }, null, 2), "utf8")
      await rename(tmp, cachePath())
    }

    /** Single-flight digest session: the setup probe and refresh cycles share
     * one reuse-or-create path, never racing into duplicate sessions. */
    const getDigest = (): Promise<string | undefined> => {
      digestFlight ??= (async (): Promise<string | undefined> => {
        if (!digestID) {
          digestID = (await readCache()).digestSessionID
          if (digestID) void probeLog(`digest adopted from cache: ${digestID}`)
        }
        if (digestID) {
          try {
            await ctx.session.get({ sessionID: digestID })
            return digestID
          } catch {
            digestID = undefined // stale — recreate below
          }
        }
        try {
          const created = (await ctx.session.create({ title: "WaitFeed news digest" })) as {
            id?: string
            sessionID?: string
          }
          const id = created?.id ?? created?.sessionID
          if (!id) {
            digestFlight = null // let the next call try again
            return undefined
          }
          digestID = id
          const fresh = await readCache()
          await writeCache(fresh)
          await probeLog(`digest session created: ${id}`)
          return id
        } catch (err) {
          digestFlight = null
          await probeLog(`digest session create FAILED: ${(err as Error)?.message ?? String(err)}`)
          return undefined
        }
      })()
      return digestFlight
    }

    /** One generation attempt, on the digest session, under a hard timeout. */
    const generateText = async (
      sessionID: string,
      prompt: string,
    ): Promise<{ ok: true; text: string } | { ok: false; gate: boolean; message: string }> => {
      try {
        const attempt = ctx.session.generate({ sessionID, prompt }) as Promise<{ text?: string }>
        const timeout = new Promise<never>((_, reject) => {
          const t = setTimeout(() => reject(new Error("generate timed out")), GENERATE_TIMEOUT_MS)
          if (typeof t.unref === "function") t.unref()
        })
        const result = await Promise.race([attempt, timeout])
        return { ok: true, text: cleanStory(result?.text ?? "") }
      } catch (err) {
        const message = (err as Error)?.message ?? String(err)
        return { ok: false, gate: isFreeTierGate(message), message }
      }
    }

    const summarize = async (cache: CacheFile, items: FeedItem[]): Promise<void> => {
      if (cache.llmUnavailable) return
      const digest = await getDigest()
      if (!digest) return
      const started = Date.now()
      // Newest first: the freshest headlines are what the ticker will show.
      const pending = items
        .filter((it) => !cache.summaries[it.url])
        .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
        .slice(0, SUMMARY_BUDGET)
      let doneCount = 0
      for (const it of pending) {
        if (doneCount > 0 && Date.now() - started > SUMMARY_TIME_BUDGET_MS) {
          await probeLog(
            `story phase paused after ${Math.round((Date.now() - started) / 1000)}s (${pending.length - doneCount} left for next cycle)`,
          )
          break
        }
        let done = false
        for (let attempt = 1; attempt <= GENERATE_RETRIES; attempt++) {
          if (attempt > 1) await new Promise((r) => setTimeout(r, 2_000 * (attempt - 1)))
          const result = await generateText(digest, buildStoryPrompt(it))
          if (result.ok) {
            if (result.text) {
              cache.summaries[it.url] = { text: result.text, at: Date.now() }
              await writeCache(cache) // incremental: stories trickle to the TUI
              await probeLog(`story ok: ${it.url} -> ${result.text.slice(0, 80)}...`)
            }
            done = true
            doneCount++
            break
          }
          if (result.gate) {
            cache.llmUnavailable = true
            await writeCache(cache)
            await probeLog("gate refused generation; layer disabled until next cycle")
            return
          }
          await probeLog(
            `story attempt ${attempt}/${GENERATE_RETRIES} failed for ${it.url}: ${result.message}`,
          )
        }
        if (!done) {
          // Upstream is down this cycle. Switch the whole view to headline mode
          // (never a mixed look); the next cycle resets the flag and re-probes.
          cache.llmUnavailable = true
          await writeCache(cache)
          await probeLog("generation failing repeatedly; headline display mode until next cycle")
          break
        }
      }
    }

    const cycle = async (): Promise<void> => {
      if (running) return
      running = true
      let held = false
      try {
        held = await acquireLock()
        if (!held) return
        const cache = await readCache()
        // Config is re-read every cycle — toggles in the reader apply on the
        // next fetch without any restart. Disabled channels are never contacted.
        const cfg = await loadConfig()
        if (cache.items.length > 0 && Date.now() - cache.fetchedAt < REFRESH_MS) {
          void probeLog(`cycle: fresh skip (age ${Math.round((Date.now() - cache.fetchedAt) / 1000)}s)`)
          return
        }
        // Self-healing probe: a fresh cycle may have a working model now.
        cache.llmUnavailable = false

        const groups = await fetchAllFeeds(cfg.sources, cfg.rssUrls)
        let items = mergeItems(groups, CACHE_ITEMS)
        await enrichMissing(items)
        items = dropJunk(items)
        cache.items = items
        cache.fetchedAt = Date.now()
        // Personal tips ride along in the same file — local git metadata only.
        cache.tips = cfg.tips ? await gitTips(process.cwd()) : []
        await writeCache(cache) // headline data lands now; the TUI reveals items as stories arrive

        await summarize(cache, items)
      } catch (err) {
        await probeLog(`cycle FAILED: ${(err as Error)?.message ?? String(err)}`)
      } finally {
        if (held) await releaseLock()
        running = false
      }
    }

    // First cycle in the background: fresh cache → no-op, stale/missing → fetch.
    void cycle()

    // One-shot probe on every load — confirms the generation path health; its
    // verdict lands in probe.log even when the cache is fresh (cycle skipped).
    void (async () => {
      try {
        const digest = await getDigest()
        if (!digest) {
          await probeLog("PROBE SKIPPED: no digest session")
          return
        }
        const result = await generateText(
          digest,
          "Reply with exactly this single word: WAITFEED-OK",
        )
        await probeLog(result.ok ? `PROBE OK: ${JSON.stringify(result.text).slice(0, 120)}` : `PROBE FAILED: ${result.message}`)
      } catch (err) {
        await probeLog(`PROBE FAILED: ${(err as Error)?.message ?? String(err)}`)
      }
    })()

    const timer = setInterval(() => void cycle(), REFRESH_MS)

    return () => {
      clearInterval(timer)
    }
  },
})
