// WaitFeed data-cycle runner for the Antigravity CLI (agy).
//
// An AGY SessionStart hook invokes this script (`node dist/scheduler.mjs
// --cycle`): ONE fetch → enrich → cache cycle in HEADLINE MODE when a
// session starts, then exit. There is no story phase here — AGY plugins
// expose no LLM API (verified against the official docs 2026-10-25) and the
// project bans API keys — so the injected story writer stays absent and the
// pipeline pins headline mode. On a machine with OpenCode installed too,
// the same ~/.config/waitfeed/cache.json is shared and the pipeline's cycle
// lock serializes both hosts.
//
// Plain-Node compatible — `npm run build:agy` bundles this file (with core,
// rss-parser and friends) into agy/dist/scheduler.mjs, self-contained so
// the staged AGY plugin directory needs no node_modules beside it.
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "../../core/config"
import { enrichMissing } from "../../core/enrich"
import { fetchAllFeeds } from "../../core/feeds"
import { makeProbeLog, runPipeline, type PipelineDeps } from "../../core/pipeline"

function dataDir(argv: string[]): string {
  const i = argv.indexOf("--data-dir")
  const custom = i >= 0 ? argv[i + 1] : undefined
  return custom && custom.length > 0 ? custom : join(homedir(), ".config", "waitfeed")
}

/** The deps that make this a full (keyless) pipeline host: real fetchers,
 * real enrichment, real config — and NO story writer (headline mode). */
export function schedulerDeps(dir: string, tag = "agy"): PipelineDeps {
  const probe = makeProbeLog(dir)
  return {
    cachePath: join(dir, "cache.json"),
    loadConfig: () => loadConfig(dir),
    fetchFeeds: fetchAllFeeds,
    enrich: enrichMissing,
    log: (line) => void probe(`${tag}: ${line}`),
  }
}

export async function main(argv: string[]): Promise<void> {
  // `--cycle` is the hook's documented invocation; running with no flags
  // behaves the same so manual runs are the same one-shot cycle.
  await runPipeline(schedulerDeps(dataDir(argv)))
}

main(process.argv.slice(2))
  .catch(() => {
    // A failed cycle must never surface as a hook failure; the pipeline
    // already logged details.
  })
  .finally(() => process.exit(0))
