// WaitFeed statusline runner for the Claude Code CLI.
//
// The Claude Code CLI executes this script via its `statusLine` configuration
// in ~/.claude/settings.json, piping the session JSON payload to stdin and
// rendering our stdout in the terminal status bar.
//
// Behavior (decisions split across statusline-state.ts and activity.ts):
//   - Busy session (hook-driven activity ledger; explicit agent_state; or the
//     legacy always-on fallback for ledger-less installs) → renders the
//     dwell-correct news card, sized inside the host's statusline field:
//       ▍ [HN] title · ▲ 17 · 12h        ← channel-colored badge, muted meta
//       Clean fed description snippet…   ← muted fed description, ≤3 rows
//       github.com/…/the-story           ← muted OSC 8 link: ctrl+click opens it
//   - Idle session, empty, or invalid payload → prints nothing (the status
//     line row collapses, AGY-style: no news on the splash or the prompt).
//   - Wall-clock dwell walk is persisted in claude-rotation.json as
//     { ticks, windowStart } and advances every dwell window (20s default).
//
// Plain-Node compatible — `npm run build:claude` bundles this file (with
// core) into claude/dist/statusline.mjs.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "../../core/config"
import { readCacheDoc } from "../../core/pipeline"
import {
  paintAgyRows,
  renderAgySnapshot,
  AGY_DWELL_DEFAULT_MS,
  isAgyBusy,
} from "../../core/agy"
import { readActivityDoc, markActivity } from "./activity"
import { readTranscriptTail, turnInterrupted } from "./interrupt"
import { parseClaudeState } from "./statusline-state"
import { readStdinText } from "./stdin"

function dataDir(argv: string[]): string {
  const i = argv.indexOf("--data-dir")
  const custom = i >= 0 ? argv[i + 1] : undefined
  return custom && custom.length > 0 ? custom : join(homedir(), ".config", "waitfeed")
}

async function readDwellState(file: string): Promise<{ ticks: number; windowStart: number }> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as { ticks?: unknown; windowStart?: unknown }
    const ticks = typeof parsed.ticks === "number" && parsed.ticks >= 0 ? parsed.ticks : 0
    const windowStart = typeof parsed.windowStart === "number" && parsed.windowStart > 0 ? parsed.windowStart : 0
    return { ticks, windowStart }
  } catch {
    return { ticks: 0, windowStart: 0 }
  }
}

async function writeDwellState(file: string, ticks: number, windowStart: number): Promise<void> {
  try {
    await mkdir(join(file, ".."), { recursive: true })
    const tmp = `${file}.${Date.now()}.tmp`
    await writeFile(tmp, JSON.stringify({ ticks, windowStart }), "utf8")
    await rename(tmp, file)
  } catch {
    // Never fail the statusline render over bookkeeping
  }
}

export async function main(argv: string[]): Promise<void> {
  const dir = dataDir(argv)
  const payload = await readStdinText()

  // The activity ledger (hook-driven) decides busy/idle when present;
  // parseClaudeState falls back to the legacy mapping without one.
  const activityDoc = await readActivityDoc(join(dir, "claude-activity.json"))
  const state = parseClaudeState(payload, { doc: activityDoc, now: Date.now() })

  // Esc-interrupt self-heal: NO hook fires when the user interrupts (Stop
  // skips interrupts, StopFailure is API-errors only), so a ledger busy mark
  // would pin the card for up to 15 minutes. The transcript records the
  // interrupt instead — when the ledger says busy but the newest turn event
  // is an interrupt marker, go quiet AND write the idle mark (so the next
  // Enter is a fresh idle→busy transition with its instant-paint flip).
  if (isAgyBusy(state)) {
    try {
      const parsed = JSON.parse(payload) as { session_id?: unknown; transcript_path?: unknown }
      if (
        typeof parsed?.session_id === "string" &&
        typeof parsed?.transcript_path === "string" &&
        parsed.transcript_path.length > 0
      ) {
        if (turnInterrupted(await readTranscriptTail(parsed.transcript_path))) {
          await markActivity(join(dir, "claude-activity.json"), parsed.session_id, false)
          state.agent_state = undefined // interrupted → quiet this render
        }
      }
    } catch {
      // Detection must never break the render.
    }
  }

  const dwellFile = join(dir, "claude-rotation.json")
  const dwell = await readDwellState(dwellFile)

  let cache = null
  try {
    cache = (await readCacheDoc(join(dir, "cache.json"))).cache
  } catch {
    cache = null
  }

  let cfg = null
  try {
    cfg = await loadConfig(dir)
  } catch {
    cfg = null
  }

  const out = renderAgySnapshot({
    cache,
    config: cfg,
    ticks: dwell.ticks,
    windowStart: dwell.windowStart,
    dwellMs: cfg?.dwellSeconds ? cfg.dwellSeconds * 1000 : AGY_DWELL_DEFAULT_MS,
    state,
  })

  if (out.ticks !== dwell.ticks || out.windowStart !== dwell.windowStart) {
    await writeDwellState(dwellFile, out.ticks, out.windowStart)
  }

  const painted = paintAgyRows(out.rows)
  if (painted.length > 0) {
    process.stdout.write(`${painted.join("\n")}\n`)
  } else {
    process.stdout.write("")
  }
}

main(process.argv.slice(2))
  .catch(() => {
    // The statusline render must never blow up the host terminal
    process.stdout.write("")
  })
  .finally(() => process.exit(0))
