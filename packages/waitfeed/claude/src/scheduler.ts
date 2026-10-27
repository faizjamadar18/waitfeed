// WaitFeed data-cycle + hook runner for the Claude Code CLI.
//
// A Claude Code SessionStart hook invokes this script (`node dist/scheduler.mjs
// --cycle`): ONE fetch → enrich → cache cycle in HEADLINE MODE when a
// session starts, then exit. There is no story phase here — Claude Code
// provides no free LLM API for plugins and the project bans API keys — so
// the injected story writer stays absent and the pipeline pins headline mode.
// On a machine with OpenCode or AGY installed too, the same
// ~/.config/waitfeed/cache.json is shared and the pipeline's cycle lock
// serializes all hosts safely.
//
// The remaining flags are the ACTIVITY LEDGER writers (claude-activity.json,
// per Claude session — see activity.ts for the contract):
//   --heartbeat  the session is actively working (UserPromptSubmit,
//                PostToolUse, PostToolUseFailure hooks — async)
//   --idle       the session went quiet (SessionStart, Stop, StopFailure,
//                SessionEnd, and the 60s idle Notification)
// Both read the hook's session_id from stdin, print NOTHING (observational
// hooks: exit 0 with empty stdout makes no decision), and always exit 0 —
// a UserPromptSubmit hook exiting non-zero would block the user's prompt.
//
// Plain-Node compatible — `npm run build:claude` bundles this file (with core,
// rss-parser and friends) into claude/dist/scheduler.mjs, self-contained so
// the staged Claude plugin directory needs no node_modules beside it.
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "../../core/config"
import { enrichMissing } from "../../core/enrich"
import { fetchAllFeeds } from "../../core/feeds"
import { makeProbeLog, runPipeline, type PipelineDeps } from "../../core/pipeline"
import { markActivity } from "./activity"
import { readStdinText } from "./stdin"

function dataDir(argv: string[]): string {
  const i = argv.indexOf("--data-dir")
  const custom = i >= 0 ? argv[i + 1] : undefined
  return custom && custom.length > 0 ? custom : join(homedir(), ".config", "waitfeed")
}

/** The deps that make this a full (keyless) pipeline host: real fetchers,
 * real enrichment, real config — and NO story writer (headline mode). */
export function schedulerDeps(dir: string, tag = "claude"): PipelineDeps {
  const probe = makeProbeLog(dir)
  return {
    cachePath: join(dir, "cache.json"),
    loadConfig: () => loadConfig(dir),
    fetchFeeds: fetchAllFeeds,
    enrich: enrichMissing,
    log: (line) => void probe(`${tag}: ${line}`),
  }
}

/** The hook payload's session id, or "" when absent/unclear — the ledger
 * keys such runs under "" so the write is never lost. */
function sessionIDFrom(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed && typeof parsed === "object" && typeof parsed.session_id === "string") {
      return parsed.session_id
    }
  } catch {
    // not JSON (or empty) — fall through
  }
  return ""
}

async function recordActivity(argv: string[], busy: boolean): Promise<void> {
  const raw = await readStdinText()
  await markActivity(join(dataDir(argv), "claude-activity.json"), sessionIDFrom(raw), busy)
}

export async function main(argv: string[]): Promise<void> {
  if (argv.includes("--heartbeat")) {
    await recordActivity(argv, true)
    return
  }
  if (argv.includes("--idle")) {
    await recordActivity(argv, false)
    return
  }
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
