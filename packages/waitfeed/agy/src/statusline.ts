// WaitFeed statusline runner for the Antigravity CLI (agy).
//
// The AGY TUI executes this script whenever the agent state changes, piping
// the documented state JSON to stdin and rendering our stdout. Behavior
// (all decisions in core/agy.ts):
//   - an ACTIVE session (working/tool_use/reviewing) → the dwell-correct
//     card, colored like the OpenCode news panel (tui.tsx palette):
//       ▍ [HN] title · ▲ 17 · 12h        ← channel-colored badge, muted meta
//       Ships hoard oil at sea…          ← muted fed description, ≤3 rows
//       github.com/…/the-story           ← muted OSC 8 link: ctrl+click opens it
//   - idle, sign-in/startup, error, unknown/missing → prints nothing (the
//     dwell clock stands still; the news never shows on the splash screen)
//   - the walk is persisted in agy-rotation.json as { ticks, windowStart }
//     and only written when it advanced (legacy {rotation} files migrate).
//
// Glue only: parse stdin → load shared data → render → print (painting
// included, as paintAgyRows lives in core). Plain-Node compatible because
// AGY has no TypeScript loader; `npm run build:agy` bundles this file (with
// core) into agy/dist/statusline.mjs.
//
// Every file access anchors to the user's home directory; the --data-dir
// flag exists purely for tests and manual debugging.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "../../core/config"
import { readCacheDoc } from "../../core/pipeline"
import {
  paintAgyRows,
  renderAgySnapshot,
  AGY_DWELL_DEFAULT_MS,
  type AgyStatuslineState,
} from "../../core/agy"

function dataDir(argv: string[]): string {
  const i = argv.indexOf("--data-dir")
  const custom = i >= 0 ? argv[i + 1] : undefined
  return custom && custom.length > 0 ? custom : join(homedir(), ".config", "waitfeed")
}

/** Collect everything the parent pipes to stdin; tolerate a silent host by
 * finishing exactly once on end/close/error, and skip a TTY (manual test run
 * = "no payload" preview mode). */
function readStdinText(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("")
      return
    }
    let buffer = ""
    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      clearTimeout(guard)
      resolve(buffer)
    }
    const guard = setTimeout(finish, 2_000)
    if (typeof guard.unref === "function") guard.unref()
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk: string) => {
      buffer += chunk
    })
    process.stdin.once("end", finish)
    process.stdin.once("close", finish)
    process.stdin.once("error", finish)
  })
}

function parseState(raw: string): AgyStatuslineState {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed && typeof parsed === "object") {
      const agentState =
        typeof parsed.agent_state === "string"
          ? parsed.agent_state
          : typeof parsed.agentState === "string"
            ? parsed.agentState
            : undefined
      const terminalWidth =
        typeof parsed.terminal_width === "number"
          ? parsed.terminal_width
          : typeof parsed.terminalWidth === "number"
            ? parsed.terminalWidth
            : undefined
      return {
        agent_state: agentState,
        terminal_width: terminalWidth,
      }
    }
  } catch {
    // a non-JSON payload (or no payload at all) = quiet: the splash shows nothing
  }
  return {}
}

/** The persisted dwell walk: how many full dwell windows the walk has
 * completed while busy, and when the current window opened. Legacy files
 * ({rotation}) migrate: a render-count walk becomes a tick count. Any
 * failure here is non-fatal — the ticker still renders. */
async function readDwellState(file: string): Promise<{ ticks: number; windowStart: number }> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as { ticks?: unknown; rotation?: unknown; windowStart?: unknown }
    const ticksRaw = typeof parsed.ticks === "number" && parsed.ticks >= 0 ? parsed.ticks : undefined
    const legacy = typeof parsed.rotation === "number" && parsed.rotation >= 0 ? parsed.rotation : undefined
    const ticks = ticksRaw ?? legacy ?? 0
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
    // never fail the statusline render over bookkeeping
  }
}

export async function main(argv: string[]): Promise<void> {
  const dir = dataDir(argv)
  const state = parseState(await readStdinText())
  const dwellFile = join(dir, "agy-rotation.json")
  const dwell = await readDwellState(dwellFile)

  let cache = null
  try {
    cache = (await readCacheDoc(join(dir, "cache.json"))).cache
  } catch {
    cache = null // first run or mid-write: honestly empty
  }
  // The user's config lives next to the cache: same channel switches and
  // dwell seconds the OpenCode TUI honors — tests point --data-dir at a
  // temp dir, so the render stays deterministic there.
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
  // The card, painted (channel-colored badge, muted body, OSC 8 link — see
  // core). One trailing newline keeps the "print nothing while quiet" shape
  // the host expects.
  const painted = paintAgyRows(out.rows)
  process.stdout.write(`${painted.join("\n")}\n`)
}

main(process.argv.slice(2))
  .catch(() => {
    // The statusline render must never blow up the host TUI.
    process.stdout.write("\n")
  })
  .finally(() => process.exit(0))
