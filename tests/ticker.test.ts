// Tests for WaitFeed's pure ticker helpers (feeds do real network I/O and are
// verified by hand + tsc; the parsing/merge/format layer is what can regress).
import { describe, expect, it } from "vitest"
import {
  decodeEntities,
  dropJunk,
  formatAgo,
  formatDuration,
  headline,
  headlineParts,
  isContextDuplicate,
  isJunkTitle,
  linkLabel,
  mergeItems,
  stripHtmlTags,
  truncate,
  type FeedItem,
} from "../.opencode/plugins/waitfeed/core/ticker"
import { buildStoryPrompt, cleanStory, isFreeTierGate, isNeedsMoreReply, isStoryable, NEEDS_MORE } from "../.opencode/plugins/waitfeed/core/llm"
import { truncateSentence } from "../.opencode/plugins/waitfeed/core/ticker"

const item = (over: Partial<FeedItem> = {}): FeedItem => ({
  id: `t-${Math.random().toString(36).slice(2)}`,
  source: "HN",
  title: "Some headline",
  url: `https://example.com/${Math.random().toString(36).slice(2)}`,
  ...over,
})

describe("formatAgo", () => {
  it("returns '' for unknown time", () => {
    expect(formatAgo(undefined)).toBe("")
    expect(formatAgo(0)).toBe("")
  })
  it("formats minutes, hours and days", () => {
    const now = Date.now()
    expect(formatAgo(now - 30_000)).toBe("now")
    expect(formatAgo(now - 2 * 60_000)).toBe("2m")
    expect(formatAgo(now - 3 * 3_600_000)).toBe("3h")
    expect(formatAgo(now - 5 * 86_400_000)).toBe("5d")
  })
})

describe("formatDuration", () => {
  it("formats short waits in seconds and long ones in m/s", () => {
    expect(formatDuration(500)).toBe("1s")
    expect(formatDuration(48_000)).toBe("48s")
    expect(formatDuration(92_000)).toBe("1m 32s")
    expect(formatDuration(60_000)).toBe("1m")
    expect(formatDuration(3_600_000)).toBe("1h")
  })
})

describe("truncate", () => {
  it("collapses whitespace", () => {
    expect(truncate("  a\n\n b \t c  ", 20)).toBe("a b c")
  })
  it("caps long text with an ellipsis", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcd…")
  })
})

describe("truncateSentence (v2 store rule: never end mid-sentence)", () => {
  it("keeps short text untouched", () => {
    expect(truncateSentence("Short.", 10)).toBe("Short.")
  })
  it("ends at the last complete sentence inside the cap", () => {
    const out = truncateSentence(
      "First sentence here. The rest of this description drags far beyond the tiny limit for sure.",
      40,
    )
    expect(out).toBe("First sentence here.")
  })
  it("accepts a sentence that ends exactly at the cap", () => {
    expect(truncateSentence("Done and finished.", 18)).toBe("Done and finished.")
  })
  it("skips abbreviation dots (e.g. the. next words are lowercase)", () => {
    // "e.g. " would false-hit; the next word is lowercase, so we cut later.
    const out = truncateSentence("Use it daily e.g. when working. But this tail goes past every reasonable cap at last.", 60)
    expect(out).toBe("Use it daily e.g. when working.")
  })
  it("falls back to a word-boundary ellipsis when no sentence fits", () => {
    const out = truncateSentence("just a bunch of lowercase words with no terminal punctuation anywhere in sight okay", 30)
    expect(out.endsWith("…")).toBe(true)
    expect(out.startsWith("just a bunch")).toBe(true)
  })
})

describe("mergeItems", () => {
  it("dedupes by url, sorts newest first and caps", () => {
    const now = Date.now()
    const a = item({ id: "a", url: "https://x.com/a", time: now - 1000 })
    const dupA = item({ id: "a2", url: "https://x.com/a", time: now - 2000 })
    const b = item({ id: "b", url: "https://x.com/b", time: now })
    const c = item({ id: "c", url: "https://x.com/c" })
    const merged = mergeItems([[a, dupA], [b], [c]], 2)
    expect(merged).toHaveLength(2)
    expect(merged[0].id).toBe("b") // newest first
    expect(merged.map((m) => m.id)).not.toContain("a2")
  })
})

describe("headline", () => {
  it("renders the slim line with badge and age", () => {
    const now = Date.now()
    expect(headline(item({ title: "Hello world", time: now - 7_200_000 }))).toBe(
      "▍ [HN] Hello world · 2h",
    )
  })
  it("omits the age when unknown", () => {
    expect(headline(item({ title: "No time", time: undefined }))).toBe("▍ [HN] No time")
  })
  it("parts expose badge/title/ago separately for colored rendering", () => {
    const now = Date.now()
    const parts = headlineParts(item({ source: "GH", title: "Repo rocks", time: now - 2 * 60_000 }))
    expect(parts.badge).toBe("[GH]")
    expect(parts.title).toBe("Repo rocks")
    expect(parts.ago).toBe("2m")
    expect(parts.bar).toBe("▍")
  })
})

describe("isJunkTitle", () => {
  it("flags bare identifiers that tell the reader nothing", () => {
    expect(isJunkTitle("DeepSeek-v4.1-Flash-1017")).toBe(true)
    expect(isJunkTitle("v1.2.3")).toBe(true)
    expect(isJunkTitle("   ")).toBe(true)
    expect(isJunkTitle("")).toBe(true)
  })
  it("keeps owner/repo names and real headlines", () => {
    expect(isJunkTitle("chenglou/handwired")).toBe(false)
    expect(isJunkTitle("OpenCode 2.3 ships TUI plugins")).toBe(false)
    expect(isJunkTitle("Show HN: I built a local news ticker")).toBe(false)
  })
})

describe("dropJunk", () => {
  it("drops bare identifiers even when enrichment added context", () => {
    const junk = item({ title: "DeepSeek-v4.1-Flash-1017", context: "rescued by meta description" })
    const repo = item({ title: "chenglou/handwired", context: "Turn JS into hardware." })
    const bareRepo = item({ title: "someone/somerepo" })
    const clean = item({ title: "Real headline with words" })
    const kept = dropJunk([junk, repo, bareRepo, clean])
    expect(kept.map((k) => k.id)).toEqual([repo.id, bareRepo.id, clean.id])
  })
})

describe("isContextDuplicate", () => {
  it("flags context that just repeats the headline", () => {
    expect(isContextDuplicate("Super Intelligence", "Super Intelligence")).toBe(true)
    expect(isContextDuplicate("Super Intelligence", "super  intelligence")).toBe(true)
    expect(isContextDuplicate("A long enough headline here", "A long enough headline here plus more")).toBe(true)
  })
  it("keeps context that adds real information", () => {
    expect(
      isContextDuplicate("DeepSeek: DeepSeek v4.1 Flash 1017", "DeepSeek V4.1 Flash 1017 is the October 17 snapshot."),
    ).toBe(false)
    expect(isContextDuplicate("Super Intelligence", "Explore the initiatives behind it")).toBe(false)
  })
  it("ignores tiny headlines (prefix rule needs substance)", () => {
    expect(isContextDuplicate("Wow", "Wow and more")).toBe(false)
  })
})

describe("html helpers", () => {
  it("decodeEntities handles named, decimal and hex entities", () => {
    expect(decodeEntities("Tom &amp; Jerry&#39;s &#x27;quote&#x27;")).toBe("Tom & Jerry's 'quote'")
    expect(decodeEntities("a&nbsp;b")).toBe("a b")
  })
  it("stripHtmlTags removes tags and collapses whitespace", () => {
    expect(stripHtmlTags("<p>Hello <i>world</i></p>\n  next")).toBe("Hello world next")
  })
})

describe("llm story helpers", () => {
  it("buildStoryPrompt feeds the LLM the metadata we already have, no research", () => {
    const story = buildStoryPrompt(
      item({ title: "Big release", context: "Some description", score: 2944, url: "https://example.com/x" }),
    )
    expect(story).toContain("Headline: Big release")
    expect(story).toContain("Description: Some description")
    expect(story).toContain("Score: 2944")
    expect(story).toContain("Link: https://example.com/x")
    expect(story).toContain("no web research")
    const bare = buildStoryPrompt(item({ title: "Thin", url: "https://example.com/y" }))
    expect(bare).toContain("Description: (none)")
    expect(bare).not.toContain("Score:")
  })
  it("v2 prompt bans the guess-clause and mandates the NEEDS_MORE handshake", () => {
    const story = buildStoryPrompt(item({ title: "T", context: "D", url: "https://example.com/z" }))
    expect(story).not.toContain("most likely refers to")
    expect(story).toContain(NEEDS_MORE)
  })
  it("isNeedsMoreReply detects the handshake and nothing else", () => {
    expect(isNeedsMoreReply("NEEDS_MORE")).toBe(true)
    expect(isNeedsMoreReply("  NEEDS MORE ")).toBe(true)
    expect(isNeedsMoreReply('"Needs-more."')).toBe(true)
    expect(isNeedsMoreReply("needs more — the description does not say enough")).toBe(true)
    expect(isNeedsMoreReply("OpenBSD 8.0 ships today.")).toBe(false)
    expect(isNeedsMoreReply("")).toBe(false)
  })
  it("isStoryable is the pre-model gate: real description only, no echoes", () => {
    const tooShort = item({ title: "Real headline about things", context: "Tiny blurb." })
    const echo = item({ title: "Super Intelligence", context: "Super Intelligence" })
    const ok = item({
      title: "Real headline about things",
      context:
        "A full page description that carries actual information about the release and its contents for devs.",
    })
    expect(isStoryable(tooShort)).toBe(false)
    expect(isStoryable(echo)).toBe(false)
    expect(isStoryable({ ...item({ title: "Real headline" }) })).toBe(false) // no context at all
    expect(isStoryable(ok)).toBe(true)
  })
  it("cleanStory collapses to flowing prose, strips quotes", () => {
    expect(cleanStory('  "A clean\n multi-line  story." ')).toBe("A clean multi-line story.")
  })
  it("cleanStory never cuts mid-word: ends at a complete sentence when long", () => {
    const raw = "First sentence here. Second sentence also fine here. Third sentence would spill well past the little cap we set."
    expect(cleanStory(raw, 60)).toBe("First sentence here. Second sentence also fine here.")
  })
  it("cleanStory keeps the whole cut when it already ends on sentence punctuation", () => {
    const raw = `${"Short sentence. ".repeat(3).trim()} Exactly fifty ends here.`
    const out = cleanStory(raw, raw.length)
    expect(out).toBe(raw)
  })
  it("cleanStory falls back to a word-boundary cut with ellipsis when no sentence fits", () => {
    const out = cleanStory("word ".repeat(100), 50)
    expect(out.endsWith("…")).toBe(true)
    expect(out.startsWith("word ")).toBe(true)
  })
  it("isFreeTierGate detects the free-tier refusal message", () => {
    expect(isFreeTierGate("OpenCode's free tier can only be used from within OpenCode.")).toBe(true)
    expect(isFreeTierGate("HTTP 429 for https://example.com")).toBe(false)
  })
})

describe("linkLabel", () => {
  it("shows the full source when it fits the width (queries kept)", () => {
    expect(linkLabel("https://news.ycombinator.com/item?id=50130570", 100)).toBe(
      "news.ycombinator.com/item?id=50130570",
    )
    expect(linkLabel("https://github.com/owner/repo", 100)).toBe("github.com/owner/repo")
    // No width budget at all → never cut.
    expect(linkLabel("https://news.ycombinator.com/item?id=50130570")).toBe(
      "news.ycombinator.com/item?id=50130570",
    )
  })
  it("keeps host + last segment and marks the skipped middle", () => {
    expect(linkLabel("https://github.com/onehumanbeing/esp32-iphone-agent", 40)).toBe(
      "github.com/…/esp32-iphone-agent",
    )
  })
  it("true full-line slugs fall back to a clean end-ellipsis", () => {
    const out = linkLabel("https://example.com/a/very-long-segment-name-here", 30)
    expect(out.length).toBeLessThanOrEqual(30)
    expect(out.endsWith("…")).toBe(true)
  })
  it("single-segment and malformed urls stay safe", () => {
    expect(linkLabel("not a url")).toBe("not a url")
    expect(linkLabel("not a url", 6)).toBe("not a…")
    const single = linkLabel("https://example.com/oneverylongpathwithoutslashes", 20)
    expect(single.length).toBeLessThanOrEqual(20)
    expect(single.endsWith("…")).toBe(true)
  })
})
