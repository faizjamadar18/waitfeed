// WaitFeed Claude Code instant-paint flip.
//
// Claude Code re-runs the statusline command IMMEDIATELY (skipping even the
// 300 ms update debounce) whenever `statusLine.command` changes in
// settings.json, and settings.json is watched live during a session
// (ConfigChange hooks run on the change — verified in the CLI's own code:
// setInputs compares the stored vs new command and runs the new one at once).
//
// That matters because none of the documented statusline triggers fires at
// prompt submit, so without this the Enter→card gap is bounded only by the
// refreshInterval timer (~2 s). The fix: the hook writers mark the ledger
// first, and on a REAL busy↔idle transition flip the stored command between
// two behavior-identical variants. Claude Code sees the change and repaints
// within a few hundred milliseconds — instant to the eye, matching OpenCode.
//
// The variant suffix is inert: the statusline bundle ignores unknown argv,
// so both variants render identically. Everything here is best-effort — any
// failure (missing file, corrupt JSON, a foreign statusLine) leaves settings
// untouched and never fails the hook.
import { readFile, writeFile } from "node:fs/promises"

/** The inert marker making the two command variants byte-different. */
export const FLIP_SUFFIX = " --wf"

/** The command with any runtime flip suffix removed. */
export function baseCommand(command: string): string {
  return command.endsWith(FLIP_SUFFIX) ? command.slice(0, -FLIP_SUFFIX.length) : command
}

/**
 * Toggle the staged statusline command between its two variants. Returns
 * true only when the file actually changed (the caller flips just once per
 * transition, so repeats cause no settings churn).
 */
export async function flipStatuslineCommand(settingsPath: string): Promise<boolean> {
  try {
    const settings = JSON.parse(await readFile(settingsPath, "utf8")) as {
      statusLine?: { command?: unknown }
    }
    const command = settings?.statusLine?.command
    if (!settings.statusLine || typeof command !== "string" || !command.includes("statusline.mjs")) return false
    const next = command.endsWith(FLIP_SUFFIX) ? baseCommand(command) : command + FLIP_SUFFIX
    if (next === command) return false
    settings.statusLine.command = next
    await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8")
    return true
  } catch {
    // Never fail a hook over a flip.
    return false
  }
}
