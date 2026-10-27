// WaitFeed Claude Code activity ledger — per-session busy/idle state.
//
// Claude Code's statusline payload carries NO busy flag, so the card cannot
// tell an actively working session from an idle prompt — the AGY host pipes
// `agent_state`, Claude Code pipes nothing. The parity fix is a tiny ledger
// driven by official, documented hooks (verified 2026-10-27):
//
//   --heartbeat  busy=true   UserPromptSubmit, PostToolUse, PostToolUseFailure
//   --idle       busy=false  SessionStart, Stop, StopFailure, SessionEnd, and
//                            the 60s idle Notification (matcher idle_prompt)
//
// The ledger is PER-SESSION (keyed by the payload's session_id): two Claude
// windows never wake each other up — only the window whose session is busy
// shows the card, exactly like the AGY host's per-TUI state. Entries older
// than an hour are pruned on every write, and a busy mark older than
// CLAUDE_BUSY_STALE_MS is treated as quiet — a crashed session can never pin
// the card on screen forever.
//
// Migration rule (deliberate): a MISSING ledger file means a pre-ledger
// install (hooks not yet re-registered) → the statusline falls back to the
// legacy always-busy panel instead of losing the news entirely. A PRESENT
// ledger is trusted strictly: a session with no entry is quiet, never busy.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"

export interface ClaudeActivity {
  busy: boolean
  at: number
}

export interface ClaudeActivityDoc {
  sessions: Record<string, ClaudeActivity>
}

/** A busy mark older than this is a crashed session, not an active one. */
export const CLAUDE_BUSY_STALE_MS = 15 * 60_000
/** Ledger entries older than this are pruned on the next write. */
export const CLAUDE_SESSION_PRUNE_MS = 60 * 60_000

export function emptyActivityDoc(): ClaudeActivityDoc {
  return { sessions: {} }
}

/** Accept any input shape (corrupt file, foreign JSON) and return only the
 * entries this module understands — everything else starts fresh. */
function normalizeSessions(raw: unknown): Record<string, ClaudeActivity> {
  const out: Record<string, ClaudeActivity> = {}
  if (!raw || typeof raw !== "object") return out
  const sessions = (raw as Record<string, unknown>).sessions
  if (!sessions || typeof sessions !== "object" || Array.isArray(sessions)) return out
  for (const [key, value] of Object.entries(sessions as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue
    const entry = value as Record<string, unknown>
    if (typeof entry.busy !== "boolean") continue
    if (typeof entry.at !== "number" || !Number.isFinite(entry.at) || entry.at <= 0) continue
    out[key] = { busy: entry.busy, at: entry.at }
  }
  return out
}

/**
 * Record one activity event for `sessionID` ("" allowed — a hook run whose
 * payload carried no session id) and prune dead sessions. Pure over the
 * injected `doc`, so the ledger rules stay unit-testable without I/O.
 */
export function applyActivity(doc: unknown, sessionID: string, busy: boolean, now: number): ClaudeActivityDoc {
  const sessions = normalizeSessions(doc)
  for (const [key, entry] of Object.entries(sessions)) {
    if (now - entry.at >= CLAUDE_SESSION_PRUNE_MS) delete sessions[key]
  }
  sessions[sessionID] = { busy, at: now }
  return { sessions }
}

/** Read the ledger file; `null` on missing or corrupt — callers treat null
 * as "no ledger" (the legacy fail-open path), never as "quiet". */
export async function readActivityDoc(file: string): Promise<ClaudeActivityDoc | null> {
  try {
    const doc = JSON.parse(await readFile(file, "utf8")) as unknown
    return { sessions: normalizeSessions(doc) }
  } catch {
    return null
  }
}

/** Atomic (tmp + rename) ledger write; never fails the caller. */
export async function writeActivityDoc(file: string, doc: ClaudeActivityDoc): Promise<void> {
  try {
    await mkdir(join(file, ".."), { recursive: true })
    const tmp = `${file}.${Date.now()}.tmp`
    await writeFile(tmp, JSON.stringify(doc), "utf8")
    await rename(tmp, file)
  } catch {
    // Bookkeeping must never fail a hook or a render.
  }
}

/** One hook event: read → apply → write, all best-effort, printing nothing. */
export async function markActivity(file: string, sessionID: string, busy: boolean, now = Date.now()): Promise<void> {
  const doc = await readActivityDoc(file)
  await writeActivityDoc(file, applyActivity(doc ?? emptyActivityDoc(), sessionID, busy, now))
}
