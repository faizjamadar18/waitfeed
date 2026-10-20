// Tests for the config normalizer — the pure validation half of config.ts
// (the I/O half always hands JSON.parse output to exactly this function).
import { describe, expect, it } from "vitest"
import { DEFAULT_CONFIG, normalizeConfig } from "../.opencode/plugins/waitfeed/core/config"

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
    expect(out.tips).toBe(true)
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
  it("records the tips switch and setupDone flag", () => {
    const out = normalizeConfig({ tips: false, setupDone: true })
    expect(out.tips).toBe(false)
    expect(out.setupDone).toBe(true)
  })
})
