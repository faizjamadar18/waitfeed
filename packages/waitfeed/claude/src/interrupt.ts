// WaitFeed Claude Code Esc-interrupt detector.
//
// Claude Code fires NO hook when the user presses Esc to interrupt a turn:
// Stop "does not run if the stoppage occurred due to a user interrupt"
// (documented), StopFailure is API-errors only, PostToolUseFailure does not
// fire for cancelled tools. So the hook-driven ledger stays busy after an
// interrupt and the card would stay pinned until the 15-minute staleness cap.
//
// The transcript records the interrupt instead (verified against real
// transcripts 2026-10-27): a user-type entry with `interruptedMessageId`
// whose text is "[Request interrupted by user]", or the tool-result variant
// "[Request interrupted by user for tool use]" when a tool was in flight.
// Bookkeeping entries (cost-state, last-prompt, ai-title, …) may follow it,
// so the decision scans BACKWARD from the end: an interrupt marker seen
// before any real turn activity means the turn died by interrupt.
//
// The statusline runs on the refresh timer (2 s), so it calls this on every
// render while the ledger says busy, self-heals the ledger to idle, and the
// card goes quiet within one refresh tick of the Esc press.
import { open } from "node:fs/promises"

/** The marker Claude Code writes into the transcript on a user interrupt. */
export const INTERRUPT_MARKER = "[Request interrupted by user"

/** The tail read is deliberately small: the interrupt entry sits at the very
 * end of the file, bookkeeping lines included — 128 KB is generous. */
const TAIL_BYTES = 128 * 1024

/** The readable text of one transcript entry's message content — the
 * string form, a text/tool_result parts array, or "". */
function contentText(message: unknown): string {
  if (!message || typeof message !== "object") return ""
  const content = (message as { content?: unknown }).content
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  let out = ""
  for (const part of content) {
    if (!part || typeof part !== "object") continue
    const p = part as { type?: unknown; text?: unknown; content?: unknown }
    if (typeof p.text === "string") out += p.text
    else if (p.type === "tool_result") out += contentText(p)
    if (out.includes(INTERRUPT_MARKER)) return out
  }
  return out
}

/**
 * Pure decision over the transcript's LAST lines (newest last, as written).
 * Walking backward: an interrupt marker before any real turn activity
 * (assistant message, user prompt/tool result) means the turn died by user
 * interrupt. Sidechain (subagent) entries never decide the main turn.
 * Undecidable tails (empty, garbage, bookkeeping-only) fail OPEN to live —
 * the card can never get stuck hidden because of a detection failure.
 */
export function turnInterrupted(lines: string[]): boolean {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (!line || line.length === 0) continue
    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue // partial or foreign line — keep walking
    }
    if (entry.isSidechain === true) continue
    const text = contentText(entry.message)
    if (text.includes(INTERRUPT_MARKER)) return true
    if (entry.type === "assistant" || entry.type === "user") return false
    // Bookkeeping types (system, cost-state, last-prompt, ai-title, …) —
    // not turn activity; keep walking toward older entries.
  }
  return false
}

/** Read the last lines of a transcript file, capped at TAIL_BYTES. A partial
 * leading line (cut mid-JSON) is dropped. Missing/unreadable → []. */
export async function readTranscriptTail(file: string): Promise<string[]> {
  try {
    const handle = await open(file, "r")
    try {
      const size = (await handle.stat()).size
      const start = Math.max(0, size - TAIL_BYTES)
      const length = size - start
      const buffer = Buffer.alloc(length)
      await handle.read(buffer, 0, length, start)
      const lines = buffer.toString("utf8").split(/\r?\n/)
      if (start > 0) lines.shift() // first line may be cut mid-JSON
      return lines
    } finally {
      await handle.close()
    }
  } catch {
    return []
  }
}
