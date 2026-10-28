// Claude Code adapter tests — the pure logic behind the statusline bundle.
//
// The contract mirrors the AGY port (core/agy.ts renders both), adapted to
// Claude Code's documented host realities:
//   1. WIDTH. Claude Code captures statusline output and renders it in a
//      field NARROWER than the COLUMNS it exports (community-measured ~3
//      columns of right margin, anthropics/claude-code#81454), and truncates
//      overflow with `…` instead of wrapping (#69967). The payload carries no
//      usable-width field. So the runner right-justifies to COLUMNS − 4 —
//      never to COLUMNS itself; a full-width row is a truncated row.
//   2. BUSY. The statusline payload has no busy flag at all. An explicit
//      agent_state (if a host ever pipes one) is trusted verbatim, AGY-style.
//      Otherwise a per-session ACTIVITY LEDGER decides — hooks mark the
//      session busy (prompt submit, tool events) and idle (Stop, StopFailure,
//      SessionEnd, the 60s idle notification) — while a ledger-less install
//      (pre-ledger settings) falls back to the legacy always-busy behavior
//      so the panel keeps working without a re-run of init.
//   3. The ledger is PER-SESSION (two Claude windows never wake each other
//      up), pruned of dead sessions, and never trusted for a session it has
//      no entry for. A crashed session's busy mark goes stale after 15 min.
import { afterEach, describe, expect, it } from "vitest"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  applyActivity,
  CLAUDE_BUSY_STALE_MS,
  CLAUDE_SESSION_PRUNE_MS,
  emptyActivityDoc,
  markActivityTransition,
  readActivityDoc,
  type ClaudeActivityDoc,
} from "../packages/waitfeed/claude/src/activity"
import { FLIP_SUFFIX, baseCommand, flipStatuslineCommand } from "../packages/waitfeed/claude/src/flip"
import { INTERRUPT_MARKER, lastInterrupt } from "../packages/waitfeed/claude/src/interrupt"
import { watchPathsOutput } from "../packages/waitfeed/claude/src/watch"
import { CLAUDE_STATUSLINE_MARGIN, parseClaudeState } from "../packages/waitfeed/claude/src/statusline-state"
import { isAgyBusy } from "../packages/waitfeed/core/agy"

// --- env / stdout column stubs (detectTerminalColumns reads both) ----------
const envColumnsBefore = process.env.COLUMNS
let stdoutColumnsDescriptor: PropertyDescriptor | undefined
let stdoutColumnsWasOwn = false

function stubTerminal(width: number | undefined): void {
  if (process.stdout && typeof process.stdout.columns === "number") {
    stdoutColumnsWasOwn = true
  }
  stdoutColumnsDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "columns")
  Object.defineProperty(process.stdout, "columns", {
    value: width,
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  if (envColumnsBefore === undefined) delete process.env.COLUMNS
  else process.env.COLUMNS = envColumnsBefore
  if (stdoutColumnsDescriptor) Object.defineProperty(process.stdout, "columns", stdoutColumnsDescriptor)
  else if (stdoutColumnsWasOwn || stdoutColumnsDescriptor === undefined) {
    // property was inherited or absent — drop our own stub either way
    try {
      delete (process.stdout as unknown as Record<string, unknown>).columns
    } catch {
      // non-configurable in this runtime — nothing to clean up
    }
  }
  stdoutColumnsDescriptor = undefined
  stdoutColumnsWasOwn = false
})

// --- payload builders -------------------------------------------------------
const session = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({
    model: { id: "claude-opus-5-5", display_name: "Opus" },
    workspace: { current_dir: "/app" },
    ...over,
  })

describe("parseClaudeState — width (usable = raw − host margin, never raw)", () => {
  it("CLAUDE_STATUSLINE_MARGIN pins the reserve at 4 columns", () => {
    expect(CLAUDE_STATUSLINE_MARGIN).toBe(4)
  })

  it("a payload width is the fallback when the host exports no width signal", () => {
    stubTerminal(undefined)
    delete process.env.COLUMNS
    expect(parseClaudeState(session({ terminal_width: 120 })).terminal_width).toBe(116)
    expect(parseClaudeState(session({ terminalWidth: 120 })).terminal_width).toBe(116)
  })

  it("env COLUMNS is the live host truth and beats a payload width", () => {
    stubTerminal(undefined)
    process.env.COLUMNS = "85"
    expect(parseClaudeState(session({ terminal_width: 120 })).terminal_width).toBe(81)
  })

  it("COLUMNS (what Claude Code actually exports) is the raw width", () => {
    stubTerminal(undefined)
    process.env.COLUMNS = "85"
    expect(parseClaudeState(session()).terminal_width).toBe(81)
  })

  it("with no width signal at all, the 80-column console default shrinks by the margin", () => {
    stubTerminal(undefined)
    delete process.env.COLUMNS
    expect(parseClaudeState(session()).terminal_width).toBe(80 - CLAUDE_STATUSLINE_MARGIN)
  })

  it("a garbage or sub-minimum COLUMNS falls back to the default", () => {
    stubTerminal(undefined)
    process.env.COLUMNS = "not-a-number"
    expect(parseClaudeState(session()).terminal_width).toBe(76)
    process.env.COLUMNS = "20"
    expect(parseClaudeState(session()).terminal_width).toBe(76)
  })

  it("the usable width never drops below the shared 30-column floor", () => {
    expect(parseClaudeState(session({ terminal_width: 30 })).terminal_width).toBe(30)
    expect(parseClaudeState(session({ terminal_width: 4 })).terminal_width).toBe(30)
  })

  it("a string width in the payload is ignored (numbers only)", () => {
    expect(parseClaudeState(session({ terminal_width: "120" })).terminal_width).toBe(76)
  })
})

describe("parseClaudeState — agent_state (explicit > ledger > legacy > quiet)", () => {
  it("an explicit agent_state is trusted verbatim, AGY-style", () => {
    expect(parseClaudeState(JSON.stringify({ agent_state: "working" })).agent_state).toBe("working")
    expect(parseClaudeState(JSON.stringify({ agent_state: "idle" })).agent_state).toBe("idle")
    expect(isAgyBusy(parseClaudeState(JSON.stringify({ agent_state: "working" })))).toBe(true)
    expect(isAgyBusy(parseClaudeState(JSON.stringify({ agent_state: "idle" })))).toBe(false)
  })

  it("a Claude session payload with no ledger falls back to the legacy always-busy mapping", () => {
    expect(parseClaudeState(session()).agent_state).toBe("working")
    expect(parseClaudeState(JSON.stringify({ cost: {} })).agent_state).toBe("working")
  })

  it("empty, corrupt, or non-object payloads stay quiet", () => {
    expect(parseClaudeState("")).toEqual({})
    expect(parseClaudeState("not-json")).toEqual({})
    expect(parseClaudeState("null")).toEqual({})
    expect(parseClaudeState("42")).toEqual({})
  })

  it("an unknown payload stays quiet", () => {
    expect(parseClaudeState(JSON.stringify({ foo: "bar" })).agent_state).toBeUndefined()
  })
})

describe("parseClaudeState — the activity ledger decides busy when present", () => {
  const NOW = 1_800_000_000_000

  it("a fresh busy mark wakes the card", () => {
    const doc = applyActivity(emptyActivityDoc(), "s1", true, NOW - 1_000)
    expect(parseClaudeState(session({ session_id: "s1" }), { doc, now: NOW }).agent_state).toBe("working")
  })

  it("a stale busy mark (crashed session) goes quiet after the staleness cap", () => {
    const doc = applyActivity(emptyActivityDoc(), "s1", true, NOW - CLAUDE_BUSY_STALE_MS - 1)
    expect(parseClaudeState(session(), { doc, now: NOW }).agent_state).toBeUndefined()
  })

  it("an idle mark stays quiet", () => {
    const doc = applyActivity(emptyActivityDoc(), "s1", false, NOW - 1_000)
    expect(parseClaudeState(session(), { doc, now: NOW }).agent_state).toBeUndefined()
  })

  it("the ledger is per-session — another session's marks never wake this one", () => {
    const doc = applyActivity(emptyActivityDoc(), "other-window", true, NOW - 1_000)
    const state = parseClaudeState(session({ session_id: "s1" }), { doc, now: NOW })
    expect(state.agent_state).toBeUndefined()
  })

  it("the payload's session_id picks the entry", () => {
    const doc = applyActivity(emptyActivityDoc(), "s1", true, NOW - 1_000)
    const state = parseClaudeState(session({ session_id: "s1" }), { doc, now: NOW })
    expect(state.agent_state).toBe("working")
  })

  it("a ledger present beats the legacy hasClaudeSession fallback — an unseen session is quiet, not busy", () => {
    const doc = applyActivity(emptyActivityDoc(), "other", false, NOW - 1_000)
    const state = parseClaudeState(session(), { doc, now: NOW })
    expect(state.agent_state).toBeUndefined()
  })

  it("an explicit agent_state overrides the ledger (hosts that do pipe state)", () => {
    const idleDoc = applyActivity(emptyActivityDoc(), "s1", false, NOW - 1_000)
    const state = parseClaudeState(JSON.stringify({ agent_state: "working", session_id: "s1" }), {
      doc: idleDoc,
      now: NOW,
    })
    expect(state.agent_state).toBe("working")
  })

  it("no ledger (null) + Claude session payload → legacy busy (fail-open)", () => {
    expect(parseClaudeState(session(), { doc: null, now: NOW }).agent_state).toBe("working")
  })
})

describe("applyActivity — the ledger bookkeeping", () => {
  const NOW = 1_800_000_000_000

  it("records a busy mark with its timestamp", () => {
    const doc = applyActivity(emptyActivityDoc(), "s1", true, NOW)
    expect(doc.sessions?.s1).toEqual({ busy: true, at: NOW })
  })

  it("flips an existing session to idle without touching siblings", () => {
    let doc = applyActivity(emptyActivityDoc(), "s1", true, NOW)
    doc = applyActivity(doc, "s2", true, NOW + 5)
    doc = applyActivity(doc, "s1", false, NOW + 10)
    expect(doc.sessions?.s1).toEqual({ busy: false, at: NOW + 10 })
    expect(doc.sessions?.s2).toEqual({ busy: true, at: NOW + 5 })
  })

  it("prunes sessions older than the prune window", () => {
    let doc = applyActivity(emptyActivityDoc(), "old", true, NOW - CLAUDE_SESSION_PRUNE_MS - 1)
    doc = applyActivity(doc, "fresh", true, NOW)
    expect(doc.sessions?.old).toBeUndefined()
    expect(doc.sessions?.fresh).toBeDefined()
  })

  it("survives a corrupt or foreign document shape", () => {
    for (const garbage of [null, undefined, 42, "junk", { sessions: "not-an-object" }, { sessions: [1, 2] }]) {
      const doc = applyActivity(garbage as unknown, "s1", true, NOW)
      expect(doc.sessions?.s1).toEqual({ busy: true, at: NOW })
    }
  })

  it("carries valid entries over from a legacy-shaped document", () => {
    const legacy = { sessions: { keep: { busy: false, at: NOW } } } as unknown as ClaudeActivityDoc
    const doc = applyActivity(legacy, "s1", true, NOW + 1)
    expect(doc.sessions?.keep).toEqual({ busy: false, at: NOW })
    expect(doc.sessions?.s1).toEqual({ busy: true, at: NOW + 1 })
  })
})

describe("readActivityDoc — the on-disk round trip keeps entries", () => {
  it("a written ledger reads back with its sessions intact (never a bare {} doc)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-act-"))
    try {
      const file = join(dir, "claude-activity.json")
      const written = applyActivity(emptyActivityDoc(), "sess-1", true, 1_800_000_000_000)
      await writeFile(file, JSON.stringify(written), "utf8")
      const doc = await readActivityDoc(file)
      expect(doc).toEqual({ sessions: { "sess-1": { busy: true, at: 1_800_000_000_000 } } })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("a missing or corrupt file reads back null (the legacy fail-open signal)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-act-"))
    try {
      expect(await readActivityDoc(join(dir, "absent.json"))).toBeNull()
      const file = join(dir, "corrupt.json")
      await writeFile(file, "{not json", "utf8")
      expect(await readActivityDoc(file)).toBeNull()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("markActivityTransition — flips are real state changes only", () => {
  it("the first mark for a session is a transition (screen changes), repeats are not", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-tr-"))
    try {
      const file = join(dir, "claude-activity.json")
      expect(await markActivityTransition(file, "s1", true)).toBe(true) // unseen → busy
      expect(await markActivityTransition(file, "s1", true)).toBe(false) // busy → busy
      expect(await markActivityTransition(file, "s1", false)).toBe(true) // busy → idle
      expect(await markActivityTransition(file, "s1", false)).toBe(false) // idle → idle
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("sessions stay independent — another window's transition never reads as ours", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-tr2-"))
    try {
      const file = join(dir, "claude-activity.json")
      expect(await markActivityTransition(file, "s1", true)).toBe(true)
      expect(await markActivityTransition(file, "s2", true)).toBe(true) // s2's own first mark
      expect(await markActivityTransition(file, "s1", true)).toBe(false) // s1 unchanged
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("flipStatuslineCommand — the instant-paint mechanism", () => {
  it("the two command variants are behavior-identical and byte-different", () => {
    const base = "node C:/h/.claude/waitfeed/dist/statusline.mjs"
    expect(baseCommand(base + FLIP_SUFFIX)).toBe(base)
    expect(baseCommand(base)).toBe(base)
  })

  it("flips to the suffixed variant and back, preserving every other setting", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-flip-"))
    try {
      const file = join(dir, "settings.json")
      const settings = {
        env: { FORCE_HYPERLINK: "1" },
        statusLine: { type: "command", command: "node /h/.claude/waitfeed/dist/statusline.mjs", refreshInterval: 2 },
        hooks: { Stop: [{ hooks: [{ type: "command", command: "node /x/scheduler.mjs --idle" }] }] },
      }
      await writeFile(file, JSON.stringify(settings, null, 2) + "\n", "utf8")

      expect(await flipStatuslineCommand(file)).toBe(true)
      const flipped = JSON.parse(await readFile(file, "utf8")) as typeof settings
      expect(flipped.statusLine.command.endsWith(FLIP_SUFFIX)).toBe(true)
      expect(flipped.statusLine.command.startsWith("node /h/.claude/waitfeed/dist/statusline.mjs")).toBe(true)
      expect(flipped.statusLine.refreshInterval).toBe(2)
      expect(flipped.env).toEqual({ FORCE_HYPERLINK: "1" })
      expect(flipped.hooks).toEqual(settings.hooks)

      expect(await flipStatuslineCommand(file)).toBe(true)
      const restored = JSON.parse(await readFile(file, "utf8")) as typeof settings
      expect(restored.statusLine.command).toBe(settings.statusLine.command)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("anything that is not our statusline stays untouched — and nothing throws", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-flip2-"))
    try {
      const foreign = join(dir, "foreign.json")
      await writeFile(
        foreign,
        JSON.stringify({ statusLine: { type: "command", command: "node elsewhere/other.mjs" } }),
        "utf8",
      )
      expect(await flipStatuslineCommand(foreign)).toBe(false)
      expect((JSON.parse(await readFile(foreign, "utf8")) as { statusLine: { command: string } }).statusLine.command).toBe(
        "node elsewhere/other.mjs",
      )

      const noStatus = join(dir, "noline.json")
      await writeFile(noStatus, JSON.stringify({ model: "x" }), "utf8")
      expect(await flipStatuslineCommand(noStatus)).toBe(false)

      const corrupt = join(dir, "corrupt.json")
      await writeFile(corrupt, "{not json", "utf8")
      expect(await flipStatuslineCommand(corrupt)).toBe(false)
      expect(await flipStatuslineCommand(join(dir, "absent.json"))).toBe(false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("lastInterrupt — the Esc-interrupt detector (no hook fires on interrupt)", () => {
  // The boolean form the original contracts were written against — every
  // assertion below stays verbatim; the `at` contracts live in the describe
  // that follows.
  const turnInterrupted = (lines: string[]): boolean => lastInterrupt(lines).interrupted
  // Entry builders shaped exactly like the real transcript lines:
  // the interrupt is a user-type entry with interruptedMessageId + marker
  // text; bookkeeping entries follow it; real prompts are plain user entries.
  const assistant = JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "working…" }] } })
  const prompt = JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: "go deeper" }] } })
  const interrupted = JSON.stringify({
    type: "user",
    interruptedMessageId: "m1",
    message: { role: "user", content: [{ type: "text", text: `${INTERRUPT_MARKER}]` }] },
  })
  const interruptedTool = JSON.stringify({
    type: "user",
    interruptedMessageId: "m2",
    message: { role: "user", content: [{ type: "tool_result", content: `${INTERRUPT_MARKER} for tool use]` }] },
  })
  const bookkeeping = JSON.stringify({ type: "cost-state" })

  it("a newest-entry interrupt marker (bookkeeping may follow it) → the turn died by Esc", () => {
    expect(turnInterrupted([assistant, bookkeeping, interrupted, bookkeeping])).toBe(true)
    expect(turnInterrupted([assistant, interruptedTool, bookkeeping])).toBe(true)
  })

  it("real turn activity after the marker means the turn is live again", () => {
    expect(turnInterrupted([interrupted, bookkeeping, prompt])).toBe(false)
    expect(turnInterrupted([interrupted, bookkeeping, assistant])).toBe(false)
  })

  it("a live turn (assistant streaming, prompt running) never reads as interrupted", () => {
    expect(turnInterrupted([assistant])).toBe(false)
    expect(turnInterrupted([prompt, assistant])).toBe(false)
  })

  it("undecidable tails fail OPEN to live — the card can never get stuck hidden", () => {
    expect(turnInterrupted([])).toBe(false)
    expect(turnInterrupted([bookkeeping])).toBe(false)
    expect(turnInterrupted(["{not json"])).toBe(false)
  })

  it("sidechain (subagent) entries never decide the main turn", () => {
    const sidechainInterrupt = JSON.stringify({
      type: "user",
      isSidechain: true,
      interruptedMessageId: "m3",
      message: { role: "user", content: [{ type: "text", text: `${INTERRUPT_MARKER}]` }] },
    })
    expect(turnInterrupted([assistant, sidechainInterrupt, bookkeeping])).toBe(false)
  })
})

describe("lastInterrupt.at — the WHEN that guards the stale-check race", () => {
  // Real transcript entries carry a timestamp; the ledger's busy mark must
  // be compared against it (a mark written AFTER the interrupt belongs to
  // the next real turn, not to the interrupted one).
  const markerAt = (iso: string): string =>
    JSON.stringify({
      type: "user",
      timestamp: iso,
      interruptedMessageId: "m1",
      message: { role: "user", content: [{ type: "text", text: `${INTERRUPT_MARKER}]` }] },
    })
  const assistant = JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "working…" }] } })
  const prompt = JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: "go on" }] } })
  const bookkeeping = JSON.stringify({ type: "cost-state" })

  it("an interrupted tail carries the interrupt entry's timestamp as epoch ms", () => {
    expect(lastInterrupt([assistant, bookkeeping, markerAt("2026-10-27T10:44:30.000Z"), bookkeeping])).toEqual({
      interrupted: true,
      at: Date.parse("2026-10-27T10:44:30.000Z"),
    })
  })

  it("a live tail is not interrupted and carries no interrupt time", () => {
    expect(lastInterrupt([markerAt("2026-10-27T10:44:30.000Z"), prompt])).toEqual({ interrupted: false, at: undefined })
    expect(lastInterrupt([assistant])).toEqual({ interrupted: false, at: undefined })
  })

  it("a timestamp-less marker still reads as interrupted, with an unknown time", () => {
    const noTs = JSON.stringify({
      type: "user",
      interruptedMessageId: "m1",
      message: { role: "user", content: [{ type: "text", text: `${INTERRUPT_MARKER}]` }] },
    })
    expect(lastInterrupt([assistant, noTs, bookkeeping])).toEqual({ interrupted: true, at: undefined })
  })

  it("a garbage timestamp stays interrupted but the time is unknown", () => {
    expect(lastInterrupt([markerAt("not-a-date")])).toEqual({ interrupted: true, at: undefined })
  })
})

describe("watchPathsOutput — seeding the transcript watcher from SessionStart", () => {
  it("returns the watchPaths JSON for a payload that carries the transcript path", () => {
    expect(JSON.parse(watchPathsOutput(JSON.stringify({ session_id: "s", transcript_path: "C:/t/x.jsonl" })))).toEqual({
      watchPaths: ["C:/t/x.jsonl"],
    })
  })

  it("prints nothing without a transcript path — plain stdout must never leak into the hook output", () => {
    expect(watchPathsOutput("{}")).toBe("")
    expect(watchPathsOutput(JSON.stringify({ transcript_path: "" }))).toBe("")
    expect(watchPathsOutput("not json")).toBe("")
  })
})
