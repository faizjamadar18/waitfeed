// WaitFeed — server-side plugin. The data pipeline itself lives in
// core/pipeline.ts (shared with the Antigravity CLI host); this file owns
// only what is OpenCode-specific: the dedicated digest session, the story
// generation path (strict rewrite of the description ONLY — items without a
// usable description never reach the model, and the model must answer
// NEEDS_MORE instead of inventing; binned replies leave the item invisible),
// the health probe and the refresh timer.
//
// Story mode shows ONLY story-complete items; the whole-view headline
// fallback stays reserved for when the LLM layer itself is unavailable.
//
// Refresh every 30 minutes; the TUI polls the cache file, so no cross-process
// messaging is needed. Zero keys, zero cloud.
import { Plugin } from "@opencode/plugin"
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "./core/config"
import { enrichMissing } from "./core/enrich"
import { fetchAllFeeds } from "./core/feeds"
import { buildStoryPrompt, cleanStory, isFreeTierGate, isNeedsMoreReply, isStoryable } from "./core/llm"
import {
  emptyCache,
  makeProbeLog,
  readCacheDoc,
  runPipeline,
  storyReady,
  STORY_TARGET,
  writeCacheDoc,
  type CacheFile,
  type CacheIo,
} from "./core/pipeline"
import type { FeedItem } from "./core/types"

const REFRESH_MS = 30 * 60 * 1000
/** Stories per refresh cycle — fresh headlines need coverage quickly, so
 * 24 land per cycle (newest first) while the whole phase stays comfortably
 * inside the cycle-lock TTL. */
const SUMMARY_BUDGET = 24
/** Soft cap for the story phase so the cycle lock never outlives its TTL;
 * anything left over is picked up next cycle. */
const SUMMARY_TIME_BUDGET_MS = 8 * 60 * 1000
const GENERATE_TIMEOUT_MS = 90_000
/** Upstream generation is flaky ("Endpoint is unavailable") — bounded retries. */
const GENERATE_RETRIES = 3
/** Re-running setup in the same shared service process leaves old timers; a
 * module-level counter tells us how many times the host re-ran setup. */
let ALIVE_SETUPS = 0

function dataDir(): string {
  return join(homedir(), ".config", "waitfeed")
}
function cachePath(): string {
  return join(dataDir(), "cache.json")
}

/** Best-effort read of the document's private keys (the digest session id is
 * a host-private field — the cache is shared with the AGY scheduler and its
 * unknown-key preservation must never be dropped by a rewrite). */
async function readExtra(): Promise<Record<string, unknown>> {
  try {
    return (await readCacheDoc(cachePath())).extra
  } catch {
    return {}
  }
}

export default Plugin.define({
  id: "waitfeed",
  async setup(ctx) {
    const probeLog = makeProbeLog(dataDir())
    void probeLog(`SETUP START pid=${process.pid} slot=${++ALIVE_SETUPS}`)
    /** The digest session ID, seeded from the cache file once per load. */
    let digestID: string | undefined
    let digestFlight: Promise<string | undefined> | null = null

    /** The host-private patch the writer carries into every incremental save
     * once a digest session exists, so the id never drops out of the shared
     * file mid-cycle. */
    const digestExtra = (): Record<string, unknown> => (digestID ? { digestSessionID: digestID } : {})

    /** Single-flight digest session: the setup probe and refresh cycles share
     * one reuse-or-create path, never racing into duplicate sessions. */
    const getDigest = (): Promise<string | undefined> => {
      digestFlight ??= (async (): Promise<string | undefined> => {
        if (!digestID) {
          const adopted = (await readExtra()).digestSessionID
          digestID = typeof adopted === "string" ? adopted : undefined
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
          try {
            const { cache, extra } = await readCacheDoc(cachePath())
            await writeCacheDoc(cachePath(), cache, { ...extra, digestSessionID: id })
          } catch {
            await writeCacheDoc(cachePath(), emptyCache(), { digestSessionID: id })
          }
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
        attempt.catch(() => {}) // a timed-out loser must not become an unhandled rejection
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

    /**
     * The OpenCode story phase, injected into the shared pipeline as the
     * story writer. Stories trick into the cache incrementally after every
     * generation so the TUI reveals items as they finish.
     */
    const writeStories = async (cache: CacheFile, items: FeedItem[], io: CacheIo): Promise<void> => {
      if (cache.llmUnavailable) return
      const digest = await getDigest()
      if (!digest) return
      const started = Date.now()
      /** One attempt per item per cycle: a NEEDS_MORE or failed item is not
       * re-asked within the same cycle (the data will not change mid-cycle).
       * isStoryable already excluded permanently-plain items above. */
      const attempted = new Set<string>()
      let ready = storyReady(cache, items)
      let doneCount = 0
      for (const it of items) {
        // mergeItems already sorted newest-first: the freshest headlines are
        // what the ticker will show, so they get stories first.
        if (doneCount >= SUMMARY_BUDGET) {
          await probeLog(`story budget spent (${doneCount}); ${ready}/${STORY_TARGET} ready`)
          break
        }
        if (ready >= STORY_TARGET) {
          await probeLog(`story target reached: ${ready}/${STORY_TARGET} ready`)
          break
        }
        if (cache.summaries[it.url]?.text) continue
        if (!isStoryable(it)) continue // no description → never a story, never visible
        if (attempted.has(it.url)) continue
        if (doneCount > 0 && Date.now() - started > SUMMARY_TIME_BUDGET_MS) {
          await probeLog(
            `story phase paused after ${Math.round((Date.now() - started) / 1000)}s (${ready}/${STORY_TARGET} ready)`,
          )
          break
        }
        attempted.add(it.url)
        let done = false
        for (let attempt = 1; attempt <= GENERATE_RETRIES; attempt++) {
          if (attempt > 1) await new Promise((r) => setTimeout(r, 2_000 * (attempt - 1)))
          const result = await generateText(digest, buildStoryPrompt(it))
          if (result.ok) {
            if (isNeedsMoreReply(result.text)) {
              // Door 2: the model says the description is unusable — bin the
              // reply, save nothing. The item stays invisible; it is NOT
              // retried (padding it from memory is exactly what was banned).
              await probeLog(`story NEEDS_MORE: ${it.url} — description unusable, item stays invisible`)
              done = true
              break
            }
            if (result.text) {
              cache.summaries[it.url] = { text: result.text, at: Date.now() }
              ready++
              await io.saveCache(digestExtra()) // incremental: stories trickle to the TUI
              await probeLog(`story ok: ${it.url} -> ${result.text.slice(0, 80)}...`)
            }
            done = true
            doneCount++
            break
          }
          if (result.gate) {
            cache.llmUnavailable = true
            await io.saveCache(digestExtra())
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
          await io.saveCache(digestExtra())
          await probeLog("generation failing repeatedly; headline display mode until next cycle")
          break
        }
      }
    }

    // The whole fetch/lock/cache cycle is the shared pipeline now — this
    // host just supplies its story writer. Result: lock and cycling behavior
    // remain identical for OpenCode and stay exercised by pipeline tests.
    const cycle = (): Promise<void> =>
      runPipeline({
        cachePath: cachePath(),
        loadConfig,
        fetchFeeds: fetchAllFeeds,
        enrich: enrichMissing,
        writeStories,
        log: (line) => void probeLog(`cycle: ${line}`),
      })

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
