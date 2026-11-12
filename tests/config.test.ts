// Tests for the config normalizer — the pure validation half of config.ts
// (the I/O half always hands JSON.parse output to exactly this function).
import { describe, expect, it } from "vitest"
import {
  DEFAULT_CONFIG,
  HOST_IDS,
  NEWS_MODES,
  getHostNewsMode,
  newsVisible,
  nextNewsMode,
  normalizeConfig,
  setHostNewsMode,
} from "../packages/waitfeed/core/config"

describe("normalizeConfig", () => {
  it("returns defaults for garbage or missing input", () => {
    expect(normalizeConfig(undefined)).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig("nope")).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig(42)).toEqual(DEFAULT_CONFIG)
  })
  it("accepts a partial config and keeps the defaults for the rest", () => {
    const out = normalizeConfig({ sources: { hn: false } })
    expect(out.sources.hn).toBe(false)
    expect(out.sources.reddit).toBe(true)
    expect(out.setupDone).toBe(false)
  })
  it("ignores unknown source keys instead of erroring", () => {
    const out = normalizeConfig({ sources: { hn: true, hackernews: false } })
    expect(out.sources.hn).toBe(true)
    expect(Object.keys(out.sources)).toHaveLength(4)
  })
  it("cleans user RSS urls: strings only, trimmed, capped at 10", () => {
    const out = normalizeConfig({ rssUrls: ["  https://a.dev/feed  ", 5, null, "", "https://b.rss/x"] })
    expect(out.rssUrls).toEqual(["https://a.dev/feed", "https://b.rss/x"])
    const capped = normalizeConfig({ rssUrls: Array.from({ length: 15 }, (_, i) => `https://x/${i}`) })
    expect(capped.rssUrls).toHaveLength(10)
  })
  it("records the setupDone flag", () => {
    const out = normalizeConfig({ setupDone: true })
    expect(out.setupDone).toBe(true)
  })
  it("clamps dwellSeconds into the 5-120 window, integer, default 20", () => {
    expect(normalizeConfig({ dwellSeconds: 1 }).dwellSeconds).toBe(5)
    expect(normalizeConfig({ dwellSeconds: 500 }).dwellSeconds).toBe(120)
    expect(normalizeConfig({ dwellSeconds: 45.6 }).dwellSeconds).toBe(46)
    expect(normalizeConfig({ dwellSeconds: "fast" }).dwellSeconds).toBe(20)
    expect(normalizeConfig(undefined).dwellSeconds).toBe(20)
  })
  it("keeps a known newsMode and falls back to auto for anything else", () => {
    expect(normalizeConfig(undefined).newsMode).toBe("auto")
    expect(normalizeConfig({ newsMode: "show" }).newsMode).toBe("show")
    expect(normalizeConfig({ newsMode: "hide" }).newsMode).toBe("hide")
    expect(normalizeConfig({ newsMode: "auto" }).newsMode).toBe("auto")
    // A hand-edited or corrupt file can never smuggle in a fourth mode.
    expect(normalizeConfig({ newsMode: "on" }).newsMode).toBe("auto")
    expect(normalizeConfig({ newsMode: 1 }).newsMode).toBe("auto")
    expect(normalizeConfig({ newsMode: null }).newsMode).toBe("auto")
  })
})

describe("the one visibility rule every host shares", () => {
  it("auto follows the agent: the card rides busy and yields while waiting on the user", () => {
    expect(newsVisible("auto", true)).toBe(true)
    expect(newsVisible("auto", false)).toBe(false)
    // A question or permission request is not executing — auto stays hidden.
    expect(newsVisible("auto", true, true)).toBe(false)
  })
  it("hide forces the card off even while busy; nothing pins it on at idle", () => {
    // 'show' is a legacy alias of auto — it never forces the card on at idle.
    expect(newsVisible("show", false)).toBe(false)
    expect(newsVisible("show", false, true)).toBe(false)
    expect(newsVisible("show", true)).toBe(true)
    expect(newsVisible("hide", true)).toBe(false)
    expect(newsVisible("hide", true, false)).toBe(false)
  })
  it("NEWS_MODES is the single source of truth for the three modes", () => {
    expect([...NEWS_MODES]).toEqual(["auto", "show", "hide"])
  })
})

describe("nextNewsMode — the toggle flips what the user is looking at", () => {
  it("a visible card is dismissed; a hidden one comes back as auto (never an idle pin)", () => {
    expect(nextNewsMode(true)).toBe("hide")
    expect(nextNewsMode(false)).toBe("auto")
  })
  it("the second press brings a hidden card back — the flip follows what is on screen", () => {
    // Start visible: press → hide. Now the card is off screen, so the next
    // press sees "not visible" and brings it back as auto (visible again only
    // while the agent works).
    const first = nextNewsMode(true)
    expect(first).toBe("hide")
    expect(nextNewsMode(false)).toBe("auto")
  })
})

describe("independent per-host news modes (opencode, claude, agy)", () => {
  it("HOST_IDS declares the three supported hosts", () => {
    expect([...HOST_IDS]).toEqual(["opencode", "claude", "agy"])
  })

  it("getHostNewsMode resolves host mode independently with fallback to shared newsMode", () => {
    const cfg = normalizeConfig({
      newsMode: "auto",
      newsModes: {
        opencode: "hide",
        claude: "show",
      },
    })
    expect(getHostNewsMode(cfg, "opencode")).toBe("hide")
    expect(getHostNewsMode(cfg, "claude")).toBe("show")
    expect(getHostNewsMode(cfg, "agy")).toBe("auto") // falls back
  })

  it("setHostNewsMode updates one host without touching other hosts", () => {
    const base = normalizeConfig({
      newsModes: {
        opencode: "hide",
        claude: "show",
        agy: "auto",
      },
    })
    const updated = setHostNewsMode(base, "opencode", "show")
    expect(getHostNewsMode(updated, "opencode")).toBe("show")
    expect(getHostNewsMode(updated, "claude")).toBe("show") // unchanged
    expect(getHostNewsMode(updated, "agy")).toBe("auto") // unchanged
  })
})
