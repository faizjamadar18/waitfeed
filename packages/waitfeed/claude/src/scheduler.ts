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
//                SessionEnd, PermissionRequest, and the 60s idle Notification)
// Both read the hook's session_id from stdin, print NOTHING (observational
// hooks: exit 0 with empty stdout makes no decision), and always exit 0 —
// a UserPromptSubmit hook exiting non-zero would block the user's prompt.
//
// On a REAL busy↔idle transition both writers ALSO flip the stored
// statusline command between two behavior-identical variants (see flip.ts):
// Claude Code re-runs the statusline immediately on a settings change, so
// the card paints/hides in ~hundreds of ms instead of at the next
// refreshInterval tick — the instant OpenCode-like Enter behavior.
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
import { markActivityTransition, readActivityDoc } from "./activity"
import { flipStatuslineCommand } from "./flip"
import { readTranscriptTail, turnInterrupted } from "./interrupt"
import { readStdinText } from "./stdin"
import { watchPathsOutput } from "./watch"

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

/** The hook payload's session id ("" when absent/unclear — the ledger keys
 * such runs under "" so the write is never lost) and transcript path. */
function payloadInfo(raw: string): { sessionID: string; transcriptPath: string | undefined } {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const sessionID = typeof parsed?.session_id === "string" ? parsed.session_id : ""
    const transcriptPath =
      typeof parsed?.transcript_path === "string" && parsed.transcript_path.length > 0
        ? parsed.transcript_path
        : undefined
    return { sessionID, transcriptPath }
  } catch {
    return { sessionID: "", transcriptPath: undefined }
  }
}

/** True when a busy ledger mark for the session is a LIE left by an
 * Esc-interrupted turn: no hook fires on interrupt, and the statusline's
 * self-heal only lands on the next refresh tick — a fast typist can hit
 * Enter before it. The transcript tells the truth. */
async function busyMarkIsInterrupt(
  ledgerFile: string,
  sessionID: string,
  transcriptPath: string | undefined,
): Promise<boolean> {
  if (!transcriptPath) return false
  const doc = await readActivityDoc(ledgerFile)
  if (doc?.sessions?.[sessionID]?.busy !== true) return false
  return turnInterrupted(await readTranscriptTail(transcriptPath))
}

async function recordActivity(argv: string[], busy: boolean): Promise<void> {
  const raw = await readStdinText()
  const { sessionID, transcriptPath } = payloadInfo(raw)
  const ledgerFile = join(dataDir(argv), "claude-activity.json")
  // The interrupt-lie check must read the ledger BEFORE this event's write
  // lands (the write would mask the stale mark it is checking).
  const lie = busy && (await busyMarkIsInterrupt(ledgerFile, sessionID, transcriptPath))
  const flipped = (await markActivityTransition(ledgerFile, sessionID, busy)) || lie
  // A REAL busy↔idle transition repaints instantly: flip the stored
  // statusline command (two behavior-identical variants) — Claude Code
  // re-runs the statusline on the settings change, skipping its update
  // debounce. Mid-run events (busy → busy) flip nothing: no churn.
  if (flipped) await flipStatuslineCommand(settingsPath(argv))
}

/** The settings file the flip rewrites — `--settings` overrides for tests;
 * the hook's real target is the user's Claude settings. */
function settingsPath(argv: string[]): string {
  const i = argv.indexOf("--settings")
  const custom = i >= 0 ? argv[i + 1] : undefined
  return custom && custom.length > 0 ? custom : join(homedir(), ".claude", "settings.json")
}

export async function main(argv: string[]): Promise<void> {
  if (argv.includes("--watch")) {
    const raw = await readStdinText()
    const out = watchPathsOutput(raw)
    if (out.length > 0) process.stdout.write(out)
    return
  }
  if (argv.includes("--interrupt-check")) {
    const raw = await readStdinText()
    const { sessionID, transcriptPath } = payloadInfo(raw)
    const ledgerFile = join(dataDir(argv), "claude-activity.json")
    if (await busyMarkIsInterrupt(ledgerFile, sessionID, transcriptPath)) {
      const flipped = await markActivityTransition(ledgerFile, sessionID, false)
      if (flipped) await flipStatuslineCommand(settingsPath(argv))
    }
    return
  }
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
