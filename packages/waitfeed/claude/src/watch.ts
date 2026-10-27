// WaitFeed Claude Code transcript-watcher seed.
//
// Claude Code fires NO hook when the user presses Esc to interrupt a turn —
// but it DOES expose FileChanged: a filesystem-watcher hook that fires the
// moment a watched file changes, no matter what changed it. The transcript
// records the interrupt ("[Request interrupted by user]"), so watching the
// transcript turns the Esc press into an instant hook event.
//
// This module shapes that handshake: a SessionStart hook returns watchPaths
// naming its transcript (the path arrives in the hook payload), and every
// later transcript write fires FileChanged → the interrupt check decides
// (see interrupt.ts) → the card hides within milliseconds of the Esc press.
//
// Pure module — no I/O, so the tests can pin the output byte-for-byte.
/** The JSON a SessionStart hook prints to seed the watcher, or "" when the
 * payload carries no transcript path (the hook then prints NOTHING — plain
 * stdout on a hook must never leak into its output). */
export function watchPathsOutput(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { transcript_path?: unknown }
    if (typeof parsed?.transcript_path === "string" && parsed.transcript_path.length > 0) {
      return JSON.stringify({ watchPaths: [parsed.transcript_path] })
    }
  } catch {
    // not JSON — nothing to seed
  }
  return ""
}
