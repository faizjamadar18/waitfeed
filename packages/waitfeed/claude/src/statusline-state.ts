// WaitFeed statusline state parsing for the Claude Code CLI — PURE logic.
//
// Split from the statusline runner so tests can import the decisions without
// triggering the module's `main()` (which reads stdin and renders).
//
// Claude Code's documented host realities (verified 2026-10-27 against the
// official statusline docs and anthropics/claude-code#81454/#69967):
//   - The statusline payload pipes NO width and NO busy flag (its fields are
//     model, workspace, cost, context_window, session_id, …). Width arrives
//     via the COLUMNS/LINES env vars, which Claude Code sets to the raw
//     terminal dimensions before every run — env first, a hypothetical
//     payload width only as a fallback.
//   - Claude Code captures the script's output and renders it in a field
//     ~3 columns narrower than COLUMNS (a fixed right inset); overflow is
//     truncated with `…`, never wrapped. A right-justified meta built to
//     exactly COLUMNS therefore loses its tail — the reported "upvotes and
//     2h cut off at the corner" bug. The runner reserves
//     CLAUDE_STATUSLINE_MARGIN columns so every row fits the usable field
//     (the same reserve ccstatusline ships as "full width minus 4").
//   - Busy: no payload flag exists. An explicit agent_state (AGY-style
//     payloads, test harnesses) is trusted verbatim; otherwise the
//     hook-driven per-session activity ledger decides; a ledger-less install
//     keeps the legacy always-busy mapping so pre-ledger setups keep working.
import { CLAUDE_BUSY_STALE_MS, type ClaudeActivityDoc } from "./activity"
import type { AgyStatuslineState } from "../../core/agy"

/** Columns of the host's statusline inset we never paint into: the ~3-column
 * right field margin plus one column of slack for glyph-width variance. */
export const CLAUDE_STATUSLINE_MARGIN = 4

/** Same one-line floor as core/agy's width band. */
const WIDTH_FLOOR = 30
/** The classic console width, when the host exports no signal at all. */
const WIDTH_FALLBACK = 80

function detectTerminalColumns(): number | undefined {
  if (process.env.COLUMNS) {
    const cols = parseInt(process.env.COLUMNS, 10)
    if (Number.isFinite(cols) && cols >= WIDTH_FLOOR && cols <= 300) return cols
  }
  if (process.stdout && typeof process.stdout.columns === "number" && process.stdout.columns >= WIDTH_FLOOR) {
    return process.stdout.columns
  }
  if (process.stderr && typeof process.stderr.columns === "number" && process.stderr.columns >= WIDTH_FLOOR) {
    return process.stderr.columns
  }
  return undefined
}

/**
 * Parse the piped session payload into the shared AGY statusline state.
 *
 * `activity` (optional) is the hook-driven ledger: when a ledger exists it
 * decides busy/idle for the payload's session; `null` or an omitted activity
 * falls back to the legacy has-session mapping. An explicit agent_state in
 * the payload always wins, verbatim — hosts that do pipe state keep exact
 * AGY parity.
 */
export function parseClaudeState(
  raw: string,
  activity?: { doc: ClaudeActivityDoc | null; now?: number },
): AgyStatuslineState {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== "object") return {}

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

    // The width: Claude Code always exports COLUMNS (the live terminal) and
    // never pipes a width field — the payload's terminal_width, if a host or
    // harness ever includes one, is only a FALLBACK signal, never an
    // override. Either way the value is a RAW terminal width: reserve the
    // host's statusline inset so no row can be truncated by the host.
    const rawWidth =
      detectTerminalColumns() ??
      (typeof parsed.terminal_width === "number" && parsed.terminal_width > 0
        ? parsed.terminal_width
        : typeof parsed.terminalWidth === "number" && parsed.terminalWidth > 0
          ? parsed.terminalWidth
          : WIDTH_FALLBACK)
    const usableWidth = Math.max(WIDTH_FLOOR, rawWidth - CLAUDE_STATUSLINE_MARGIN)

    if (explicitState !== undefined) {
      return { agent_state: explicitState, terminal_width: usableWidth }
    }

    if (activity?.doc) {
      const sessionID = typeof parsed.session_id === "string" ? parsed.session_id : ""
      const entry = activity.doc.sessions?.[sessionID]
      const now = activity.now ?? Date.now()
      const freshBusy = entry !== undefined && entry.busy && now - entry.at < CLAUDE_BUSY_STALE_MS
      return { agent_state: freshBusy ? "working" : undefined, terminal_width: usableWidth }
    }

    // No ledger (pre-ledger install) → the legacy always-busy panel.
    return { agent_state: hasClaudeSession ? "working" : undefined, terminal_width: usableWidth }
  } catch {
    // Non-JSON or empty payload → quiet
  }
  return {}
}
