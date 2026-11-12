// WaitFeed — OpenCode server-side plugin.
// Runs the shared feed pipeline in the background: fetches configured channels,
// enriches descriptions, and writes ~/.config/waitfeed/cache.json.
// Zero AI calls, zero tokens, zero API keys.
import { Plugin } from "@opencode/plugin"
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "../core/config"
import { enrichMissing } from "../core/enrich"
import { fetchAllFeeds } from "../core/feeds"
import { makeProbeLog, runPipeline } from "../core/pipeline"

/** How often the plugin asks the pipeline whether to refill. The pipeline's
 * own baseline is 30 minutes (a fresh cache is skipped); this short tick only
 * lets the low-water refill land promptly once the queue runs low. */
const CHECK_MS = 30 * 1000
let ALIVE_SETUPS = 0

function dataDir(): string {
  return join(homedir(), ".config", "waitfeed")
}
function cachePath(): string {
  return join(dataDir(), "cache.json")
}

export default Plugin.define({
  id: "waitfeed",
  async setup() {
    const probeLog = makeProbeLog(dataDir())
    void probeLog(`SETUP START pid=${process.pid} slot=${++ALIVE_SETUPS}`)

    const cycle = (): Promise<void> =>
      runPipeline({
        cachePath: cachePath(),
        loadConfig,
        fetchFeeds: fetchAllFeeds,
        enrich: enrichMissing,
        log: (line) => void probeLog(`cycle: ${line}`),
      })

    // First cycle in the background: fresh cache -> no-op, stale/missing -> fetch.
    void cycle()

    const timer = setInterval(() => void cycle(), CHECK_MS)

    return () => {
      clearInterval(timer)
    }
  },
})
