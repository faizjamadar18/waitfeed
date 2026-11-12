// Pure per-session turn & ctrl+o dismissal state transitions for OpenCode.
// Keeping these transitions pure ensures mid-run events (step boundaries,
// duplicate execution.started signals, background sub-agents, compaction)
// never overwrite a user's ctrl+o dismissal during an active working turn.
import { getHostNewsMode, setHostNewsMode, type WaitFeedConfig } from "../core/config"

export interface TurnMaps {
  readonly active: Record<string, boolean>
  readonly dismissed: Record<string, boolean>
}

export interface TurnTransition extends TurnMaps {
  readonly cfg: WaitFeedConfig
  readonly changed: boolean
}

/** Only user-initiated inbox items (or untyped fallback) start a new turn.
 * Internal compaction, synthetic, or move items must not re-open a dismissed card. */
export function isUserTurnTrigger(itemType: string | undefined): boolean {
  return itemType === undefined || itemType === "user"
}

/** Starts a turn for `sid`. Idempotent once the session is already active or
 * dismissed, so duplicate lifecycle events or mid-run steering prompts never
 * undo `ctrl+o` hide. Background sessions (`sid !== activeSid`) never reset
 * the focused host's `newsMode` in config. */
export function applyTurnStart(
  maps: TurnMaps,
  cfg: WaitFeedConfig,
  sid: string | undefined,
  activeSid: string | undefined,
): TurnTransition {
  if (!sid || maps.active[sid] || maps.dismissed[sid]) {
    return { ...maps, cfg, changed: false }
  }
  const active = { ...maps.active, [sid]: true }
  const dismissed = { ...maps.dismissed, [sid]: false }
  const isFocused = !activeSid || sid === activeSid
  const nextCfg =
    isFocused && getHostNewsMode(cfg, "opencode") !== "auto"
      ? setHostNewsMode(cfg, "opencode", "auto")
      : cfg
  return { active, dismissed, cfg: nextCfg, changed: true }
}

/** Ends the turn for `sid`, clearing per-session active/dismissed flags and
 * returning an ephemeral `"show"` override back to `"auto"` when focused. */
export function applyTurnEnd(
  maps: TurnMaps,
  cfg: WaitFeedConfig,
  sid: string | undefined,
  activeSid: string | undefined,
): TurnTransition {
  const active =
    sid && maps.active[sid] ? { ...maps.active, [sid]: false } : maps.active
  const dismissed =
    sid && maps.dismissed[sid] ? { ...maps.dismissed, [sid]: false } : maps.dismissed
  const isFocused = !activeSid || !sid || sid === activeSid
  const nextCfg =
    isFocused && getHostNewsMode(cfg, "opencode") === "show"
      ? setHostNewsMode(cfg, "opencode", "auto")
      : cfg
  const changed = active !== maps.active || dismissed !== maps.dismissed || nextCfg !== cfg
  return { active, dismissed, cfg: nextCfg, changed }
}

/** Removes per-session entries when a session is deleted. */
export function deleteTurnSession(maps: TurnMaps, sid: string): TurnMaps {
  const active = { ...maps.active }
  const dismissed = { ...maps.dismissed }
  delete active[sid]
  delete dismissed[sid]
  return { active, dismissed }
}

