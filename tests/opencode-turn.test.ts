// Unit tests for OpenCode's per-session turn lifecycle and ctrl+o dismissal
// invariants: once dismissed with ctrl+o, no mid-run event (duplicate execution
// starts, compaction, background sub-agents, or steering) can pop the card
// back open until the user toggles it again or starts a new turn after completion.
import { describe, expect, it } from "vitest"
import { DEFAULT_CONFIG, getHostNewsMode, setHostNewsMode, type WaitFeedConfig } from "../packages/waitfeed/core/config"
import {
  applyTurnEnd,
  applyTurnStart,
  deleteTurnSession,
  isUserTurnTrigger,
  type TurnMaps,
} from "../packages/waitfeed/opencode/turn-state"

function baseCfg(): WaitFeedConfig {
  return {
    ...DEFAULT_CONFIG,
    sources: { ...DEFAULT_CONFIG.sources },
    rssUrls: [],
  }
}

describe("OpenCode turn lifecycle & ctrl+o dismissal consistency", () => {
  it("keeps ctrl+o dismissal intact across duplicate start events in the same turn", () => {
    let maps: TurnMaps = { active: {}, dismissed: {} }
    let cfg = baseCfg()

    // 1. User hits Enter -> inbox.enqueued starts the turn and shows news.
    const start1 = applyTurnStart(maps, cfg, "s1", "s1")
    expect(start1.changed).toBe(true)
    expect(start1.active.s1).toBe(true)
    expect(start1.dismissed.s1).toBe(false)
    expect(getHostNewsMode(start1.cfg, "opencode")).toBe("auto")
    maps = { active: start1.active, dismissed: start1.dismissed }
    cfg = start1.cfg

    // 2. User presses ctrl+o to focus on code changes.
    maps = { active: maps.active, dismissed: { ...maps.dismissed, s1: true } }
    cfg = setHostNewsMode(cfg, "opencode", "hide")

    // 3. Subsequent execution.started / steering prompt during the active run must be a no-op.
    const dup = applyTurnStart(maps, cfg, "s1", "s1")
    expect(dup.changed).toBe(false)
    expect(dup.dismissed.s1).toBe(true)
    expect(getHostNewsMode(dup.cfg, "opencode")).toBe("hide")
  })

  it("refuses to un-dismiss when dismissed flag is already set even if active flag was missed", () => {
    const maps: TurnMaps = { active: {}, dismissed: { s1: true } }
    const cfg = setHostNewsMode(baseCfg(), "opencode", "hide")

    const res = applyTurnStart(maps, cfg, "s1", "s1")
    expect(res.changed).toBe(false)
    expect(res.dismissed.s1).toBe(true)
    expect(getHostNewsMode(res.cfg, "opencode")).toBe("hide")
  })

  it("ignores non-user inbox items (compaction, synthetic, move) as turn-start triggers", () => {
    expect(isUserTurnTrigger("user")).toBe(true)
    expect(isUserTurnTrigger(undefined)).toBe(true)
    expect(isUserTurnTrigger("compaction")).toBe(false)
    expect(isUserTurnTrigger("synthetic")).toBe(false)
    expect(isUserTurnTrigger("move")).toBe(false)
  })

  it("background sub-agent sessions never override the focused session's hide mode", () => {
    const maps: TurnMaps = { active: { main: true }, dismissed: { main: true } }
    const cfg = setHostNewsMode(baseCfg(), "opencode", "hide")

    const subStart = applyTurnStart(maps, cfg, "subagent", "main")
    expect(subStart.changed).toBe(true)
    expect(subStart.active.subagent).toBe(true)
    // Main session dismissal and host hide mode stay completely untouched:
    expect(subStart.dismissed.main).toBe(true)
    expect(getHostNewsMode(subStart.cfg, "opencode")).toBe("hide")
  })

  it("resets dismissal on turn end and allows news again on the next task's Enter", () => {
    let maps: TurnMaps = { active: { s1: true }, dismissed: { s1: true } }
    let cfg = setHostNewsMode(baseCfg(), "opencode", "hide")

    // Turn 1 ends -> active and dismissed flags clear; hide persists until next prompt.
    const end = applyTurnEnd(maps, cfg, "s1", "s1")
    expect(end.changed).toBe(true)
    expect(end.active.s1).toBe(false)
    expect(end.dismissed.s1).toBe(false)
    expect(getHostNewsMode(end.cfg, "opencode")).toBe("hide")
    maps = { active: end.active, dismissed: end.dismissed }
    cfg = end.cfg

    // Idempotent duplicate end event (e.g. session.idle after execution.succeeded):
    const end2 = applyTurnEnd(maps, cfg, "s1", "s1")
    expect(end2.changed).toBe(false)

    // Turn 2 starts when user hits Enter -> mode restores to auto so news appears.
    const turn2 = applyTurnStart(maps, cfg, "s1", "s1")
    expect(turn2.changed).toBe(true)
    expect(turn2.active.s1).toBe(true)
    expect(turn2.dismissed.s1).toBe(false)
    expect(getHostNewsMode(turn2.cfg, "opencode")).toBe("auto")
  })

  it("resets ephemeral show mode on focused turn end, but ignores background turn ends", () => {
    const maps: TurnMaps = { active: { main: true, bg: true }, dismissed: {} }
    const cfg = setHostNewsMode(baseCfg(), "opencode", "show")

    const bgEnd = applyTurnEnd(maps, cfg, "bg", "main")
    expect(getHostNewsMode(bgEnd.cfg, "opencode")).toBe("show")

    const mainEnd = applyTurnEnd(
      { active: bgEnd.active, dismissed: bgEnd.dismissed },
      bgEnd.cfg,
      "main",
      "main",
    )
    expect(getHostNewsMode(mainEnd.cfg, "opencode")).toBe("auto")
  })

  it("cleans up session state on deletion", () => {
    const maps: TurnMaps = { active: { s1: true, s2: true }, dismissed: { s1: true } }
    const cleaned = deleteTurnSession(maps, "s1")
    expect(cleaned.active).toEqual({ s2: true })
    expect(cleaned.dismissed).toEqual({})
  })
})

