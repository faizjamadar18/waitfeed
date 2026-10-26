// WaitFeed statusline runner for the Claude Code CLI.
//
// The Claude Code CLI executes this script via its `statusLine` configuration
// in ~/.claude/settings.json, piping the session JSON payload to stdin and
// rendering our stdout in the terminal status bar.
//
// Behavior:
//   - Active Claude Code session (has model, workspace, context_window, or
//     agent_state payload) → renders the dwell-correct news card:
//       ▍ [HN] title · ▲ 17 · 12h        ← channel-colored badge, muted meta
//       Clean fed description snippet…   ← muted fed description, ≤3 rows
//       github.com/…/the-story           ← muted OSC 8 link: ctrl+click opens it
//   - Empty, invalid, or quiet payload → prints nothing.
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
  type AgyStatuslineState,
} from "../../core/agy"

function dataDir(argv: string[]): string {
  const i = argv.indexOf("--data-dir")
  const custom = i >= 0 ? argv[i + 1] : undefined
  return custom && custom.length > 0 ? custom : join(homedir(), ".config", "waitfeed")
}

/** Collect everything the host pipes to stdin; tolerate a silent host by
 * finishing on end/close/error, and skip a TTY (manual test run). */
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

function detectTerminalColumns(): number | undefined {
  if (process.env.COLUMNS) {
    const cols = parseInt(process.env.COLUMNS, 10)
    if (Number.isFinite(cols) && cols >= 30 && cols <= 300) return cols
  }
  if (process.stdout && typeof process.stdout.columns === "number" && process.stdout.columns >= 30) {
    return process.stdout.columns
  }
  if (process.stderr && typeof process.stderr.columns === "number" && process.stderr.columns >= 30) {
    return process.stderr.columns
  }
  return undefined
}

export function parseClaudeState(raw: string): AgyStatuslineState {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed && typeof parsed === "object") {
      const explicitState =
        typeof parsed.agent_state === "string"
          ? parsed.agent_state
          : typeof parsed.agentState === "string"
            ? parsed.agentState
            : undefined

      // Claude Code pipes { model, context_window, cost, workspace, ... }
      const hasClaudeSession =
        parsed.model !== undefined ||
        parsed.workspace !== undefined ||
        parsed.context_window !== undefined ||
        parsed.cost !== undefined

      const agentState = explicitState ?? (hasClaudeSession ? "working" : undefined)

      let terminalWidth: number | undefined
      if (typeof parsed.terminal_width === "number" && parsed.terminal_width > 0) {
        terminalWidth = parsed.terminal_width
      } else if (typeof parsed.terminalWidth === "number" && parsed.terminalWidth > 0) {
        terminalWidth = parsed.terminalWidth
      } else {
        // Safe default for standard 80-column terminals (Claude Code pipes session without terminal_width)
        terminalWidth = detectTerminalColumns() ?? 80
      }

      return {
        agent_state: agentState,
        terminal_width: terminalWidth,
      }
    }
  } catch {
    // Non-JSON or empty payload → quiet
  }
  return {}
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
  const state = parseClaudeState(await readStdinText())
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
