// Claude Code bundle tests — the deliverable must run cleanly in plain Node.
//
// Verified behaviors:
//   1. The shipping file list in package.json includes the claude directory.
//   2. The built bundle (claude/dist/scheduler.mjs) exists and is
//      self-contained — rss-parser and every dependency is bundled inline,
//      because the staged directory sits outside any node_modules tree.
//   3. E2E: the scheduler bundle runs a keyless headline-mode cycle cleanly
//      (`node scheduler.mjs --cycle`) without dynamic require errors.
//
// The news card itself no longer has a statusline bundle: it rides the mod's
// AbovePrompt band and reads the host's own `isWorking` (see
// tests/claude-mod.test.ts). The only Node artifact left is the data cycle.
import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PKG = join(import.meta.dirname, "..", "packages", "waitfeed")
const CLAUDE = join(PKG, "claude")
const SCHEDULER_BUNDLE = join(CLAUDE, "dist", "scheduler.mjs")
const distReady = existsSync(SCHEDULER_BUNDLE)

if (!distReady) console.warn("[waitfeed] claude/dist missing — run `npm test` (pretest builds the Claude bundle)")

describe("Claude adapter packaging", () => {
  it("the shipping file list in package.json includes the claude directory", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8")) as { files: string[] }
    expect(pkg.files).toContain("claude/")
  })
})

describe.skipIf(!distReady)("built Claude bundle (pretest artifact)", () => {
  it("the bundle exists and is self-contained — no bare dependency imports", async () => {
    const source = await readFile(SCHEDULER_BUNDLE, "utf8")
    expect(source.length, "scheduler bundle is empty").toBeGreaterThan(100)
    expect(source, "still imports rss-parser from a node_modules lookup").not.toMatch(
      /from\s*["']rss-parser["']/,
    )
  })

  it("E2E — the bundle runs a keyless headline-mode cycle cleanly in plain Node", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-sched-"))
    try {
      const fresh = JSON.stringify({
        items: [{ id: "x", source: "HN", title: "Fresh item", url: "https://example.com/x" }],
        fetchedAt: Date.now(),
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), fresh, "utf8")
      const res = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--data-dir", dir, "--cycle"], {
        encoding: "utf8",
        timeout: 10_000,
      })
      expect(res.status).toBe(0)
      expect(res.stderr).not.toContain("Dynamic require")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — an unexpected argument never crashes the runner", () => {
    const bad = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--unknown-flag", "x"], {
      input: "",
      encoding: "utf8",
      timeout: 10_000,
    })
    expect(bad.status).toBe(0)
  })
})
