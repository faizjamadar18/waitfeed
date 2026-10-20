// Tests for WaitFeed's personal-tip helpers (pure git-output parsing only).
import { describe, expect, it } from "vitest"
import {
  parseLogLines,
  parsePorcelain,
  tipsFromFacts,
  tipsFromGitOutput,
  type GitFacts,
} from "../.opencode/plugins/waitfeed/core/tip"

const dayAgo = Math.floor((Date.now() - 3_600_000) / 1000) // 1h ago, in git's %ct seconds

describe("parsePorcelain", () => {
  it("counts non-empty change lines and ignores the trailing newline", () => {
    expect(parsePorcelain("M  a.ts\n M b/c.js\n?? new.py\n")).toBe(3)
    expect(parsePorcelain("")).toBe(0)
  })
})

describe("parseLogLines", () => {
  it("parses %ct|%s pairs, keeping pipes inside subjects", () => {
    const lines = parseLogLines(`${dayAgo}|fix ticker bug\n${dayAgo}|feat: a | b\n`)
    expect(lines).toHaveLength(2)
    expect(lines[0].epoch).toBe(dayAgo * 1000)
    expect(lines[0].subject).toBe("fix ticker bug")
    expect(lines[1].subject).toBe("feat: a | b")
  })
  it("skips malformed lines", () => {
    expect(parseLogLines("garbage\n0|epoch zero\n")).toEqual([])
  })
})

describe("tipsFromFacts", () => {
  const facts = (over: Partial<GitFacts> = {}): GitFacts => ({ dirty: 0, commitsToday: 0, ...over })

  it("reports dirty files", () => {
    expect(tipsFromFacts(facts({ dirty: 3 }))[0]).toBe("3 uncommitted changes")
    expect(tipsFromFacts(facts({ dirty: 1 }))[0]).toBe("1 uncommitted change")
  })
  it("reports commits today with the last subject", () => {
    const tips = tipsFromFacts(facts({ commitsToday: 2, lastSubject: "fix bug" }))
    expect(tips).toHaveLength(1)
    expect(tips[0]).toContain("2 commits today")
    expect(tips[0]).toContain('"fix bug"')
  })
  it("caps the subject length so the card never blows up", () => {
    const tips = tipsFromFacts(facts({ commitsToday: 1, lastSubject: "word ".repeat(40) }))
    expect(tips[0].length).toBeLessThanOrEqual(90)
  })
  it("stays honest when the day is empty", () => {
    expect(tipsFromFacts(facts())).toEqual(["commit history is quiet today — the agent's on it"])
  })
  it("shows several lines when there is a lot to say", () => {
    const tips = tipsFromFacts(facts({ dirty: 2, commitsToday: 4, lastSubject: "ship it" }))
    expect(tips).toHaveLength(2)
  })
})

describe("tipsFromGitOutput", () => {
  it("combines porcelain + log output end to end", () => {
    const tips = tipsFromGitOutput(
      ` M a.ts\n?? b.py\nM  c.md\n`,
      `${dayAgo}|fix reader keys\n${dayAgo}|add tests\n`,
    )
    expect(tips[0]).toBe("3 uncommitted changes")
    expect(tips[1]).toContain("2 commits today")
    expect(tips[1]).toContain('"fix reader keys"')
  })
  it("falls back to the quiet-day line for a clean repo", () => {
    expect(tipsFromGitOutput("", "")).toEqual(["commit history is quiet today — the agent's on it"])
  })
})
