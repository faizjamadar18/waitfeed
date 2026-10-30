// WaitFeed reader memory — what the /news panel itself already brought to
// the user, kept on disk so it survives OpenCode restarts. The ledger only
// ever records facts the software can prove about its own actions:
//
//   read    — the user pressed a key on the item (Enter opened the link,
//             or x marked it done). A downloaded record, a user action.
//   glanced — the ticker displayed the item for a full dwell. Displayed,
//             not read: the software never claims to know where the user
//             was looking.
//
// Everything else is "upcoming" — still waiting in line to be brought. An
// item ignored costs nothing and is never judged; it just stays findable.
// Marks age out at the same window the cache keeps items (36h) — after
// that neither the item nor its mark means anything anymore.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import type { FeedItem } from "../core/types"

/** Marks live exactly as long as the cache keeps items (36h). */
const MAX_AGE_MS = 36 * 60 * 60 * 1000

export type MarkKind = "read" | "glanced"

export interface ReaderState {
  /** url-shaped key -> epoch ms of the mark. */
  read: Record<string, number>
  glanced: Record<string, number>
}

export const emptyReaderState = (): ReaderState => ({ read: {}, glanced: {} })

/** The dedupe key — the same url/id rule the pipeline uses for merging. */
export function itemKey(it: FeedItem): string {
  return (it.url || it.id).trim().toLowerCase()
}

/** Record a mark immutably: returns a NEW state, never mutates the input. */
export function markItem(state: ReaderState, kind: MarkKind, key: string, at = Date.now()): ReaderState {
  const next: ReaderState = { read: { ...state.read }, glanced: { ...state.glanced } }
  next[kind][key] = at
  return next
}

/** Drop marks older than the retention window (both piles age together). */
export function pruneState(state: ReaderState, now = Date.now()): ReaderState {
  const floor = now - MAX_AGE_MS
  const out: ReaderState = { read: {}, glanced: {} }
  for (const [key, at] of Object.entries(state.read)) if (at > floor) out.read[key] = at
  for (const [key, at] of Object.entries(state.glanced)) if (at > floor) out.glanced[key] = at
  return out
}

export interface ReaderGroups {
  /** Brought to the user at least once (read or glanced), latest mark first. */
  seen: FeedItem[]
  /** Everything still waiting in line, input order preserved (newest first). */
  upcoming: FeedItem[]
}

/** The two piles. One mark of either kind puts an item in SEEN, once. */
export function groupItems(items: FeedItem[], state: ReaderState): ReaderGroups {
  const markOf = (it: FeedItem): number => {
    const key = itemKey(it)
    return Math.max(state.read[key] ?? 0, state.glanced[key] ?? 0)
  }
  const seen: Array<{ it: FeedItem; at: number }> = []
  const upcoming: FeedItem[] = []
  for (const it of items) {
    const at = markOf(it)
    if (at > 0) seen.push({ it, at })
    else upcoming.push(it)
  }
  seen.sort((a, b) => b.at - a.at)
  return { seen: seen.map((s) => s.it), upcoming }
}

export function readerStatePath(): string {
  return join(homedir(), ".config", "waitfeed", "reader-state.json")
}

/** Missing or corrupt file → empty ledger. A broken ledger may never break
 * the reader; it degrades to the honest "everything upcoming" view. */
export async function loadReaderState(path: string): Promise<ReaderState> {
  try {
    const raw = JSON.parse(await readFile(path, "utf8")) as Partial<ReaderState>
    return pruneState({
      read: raw.read && typeof raw.read === "object" ? raw.read : {},
      glanced: raw.glanced && typeof raw.glanced === "object" ? raw.glanced : {},
    })
  } catch {
    return emptyReaderState()
  }
}

/** Atomic write (tmp + rename), the same pattern as cache and config. */
export async function saveReaderState(path: string, state: ReaderState): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true })
  const tmp = `${path}.${Date.now()}.tmp`
  await writeFile(tmp, JSON.stringify(pruneState(state), null, 2), "utf8")
  await rename(tmp, path)
}
