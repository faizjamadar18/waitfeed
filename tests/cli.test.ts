// CLI onboarding tests — validates multi-agent detection, configuration,
// and CLI flags for npx waitfeed init.
import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  detectOpenCode,
  detectAgy,
  detectClaude,
  stripJsoncComments,
  registerOpenCodePlugin,
  registerAgyPlugin,
  registerClaudePlugin,
  saveWaitFeedUserConfig,
  countLinesRows,
} from "../packages/waitfeed/bin.mjs"

const PKG = join(import.meta.dirname, "..", "packages", "waitfeed")
const BIN = join(PKG, "bin.mjs")

describe("CLI flag execution", () => {
  it("--help prints usage with supported agent providers", () => {
    const res = spawnSync(process.execPath, [BIN, "--help"], { encoding: "utf8" })
    expect(res.status).toBe(0)
    expect(res.stdout).toContain("WaitFeed")
    expect(res.stdout).toContain("OpenCode")
    expect(res.stdout).toContain("Google Antigravity (AGY)")
    expect(res.stdout).toContain("Claude Code")
    expect(res.stdout).toContain("npx waitfeed init")
  })

  it("--version prints current package version", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8")) as { version: string }
    const res = spawnSync(process.execPath, [BIN, "--version"], { encoding: "utf8" })
    expect(res.status).toBe(0)
    expect(res.stdout.trim()).toBe(`waitfeed v${pkg.version}`)
  })
})

describe("Agent environment detection helpers", () => {
  it("detectOpenCode returns boolean installation indicator", () => {
    const res = detectOpenCode()
    expect(typeof res.installed).toBe("boolean")
    expect(typeof res.binary).toBe("boolean")
    expect(typeof res.configExists).toBe("boolean")
  })

  it("detectAgy returns boolean installation indicator", () => {
    const res = detectAgy()
    expect(typeof res.installed).toBe("boolean")
    expect(typeof res.binary).toBe("boolean")
  })

  it("detectClaude returns boolean installation indicator", () => {
    const res = detectClaude()
    expect(typeof res.installed).toBe("boolean")
    expect(typeof res.binary).toBe("boolean")
  })
})

describe("JSONC comment stripping", () => {
  it("strips block and inline comments cleanly", () => {
    const raw = `
      // top level comment
      {
        /* block comment */
        "plugins": ["test"] // inline comment
      }
    `
    const clean = stripJsoncComments(raw)
    const parsed = JSON.parse(clean) as { plugins: string[] }
    expect(parsed.plugins).toEqual(["test"])
  })
})

describe("Config writers in isolated environments", () => {
  it("saveWaitFeedUserConfig creates config.json with provided sources", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-cfg-"))
    try {
      const saved = await saveWaitFeedUserConfig({ hn: true, devto: false }, ["https://news.ycombinator.com/rss"], dir)
      expect(existsSync(saved)).toBe(true)
      const data = JSON.parse(await readFile(saved, "utf8")) as {
        setupDone: boolean
        sources: Record<string, boolean>
        rssUrls: string[]
        dwellSeconds: number
      }
      expect(data.setupDone).toBe(true)
      expect(data.sources.hn).toBe(true)
      expect(data.sources.devto).toBe(false)
      expect(data.rssUrls).toEqual(["https://news.ycombinator.com/rss"])
      expect(data.dwellSeconds).toBe(20)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("registerOpenCodePlugin creates opencode.jsonc and adds waitfeed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opencode-cfg-"))
    try {
      const res = await registerOpenCodePlugin(dir)
      expect(res.alreadyRegistered).toBe(false)
      expect(existsSync(res.configPath)).toBe(true)
      const data = JSON.parse(await readFile(res.configPath, "utf8")) as { plugins: string[] }
      expect(data.plugins).toContain("waitfeed")

      // Second run detects existing registration without duplicating
      const second = await registerOpenCodePlugin(dir)
      expect(second.alreadyRegistered).toBe(true)
      const secondData = JSON.parse(await readFile(res.configPath, "utf8")) as { plugins: string[] }
      expect(secondData.plugins.filter((p) => p === "waitfeed")).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("registerAgyPlugin stages bundles and registers statusLine hook", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agy-home-"))
    try {
      const res = await registerAgyPlugin(dir)
      expect(existsSync(join(res.pluginDir, "plugin.json"))).toBe(true)
      expect(existsSync(join(res.pluginDir, "hooks.json"))).toBe(true)
      expect(existsSync(join(res.pluginDir, "dist", "statusline.mjs"))).toBe(true)
      expect(existsSync(join(res.pluginDir, "dist", "scheduler.mjs"))).toBe(true)
      expect(existsSync(res.settingsPath)).toBe(true)

      const settings = JSON.parse(await readFile(res.settingsPath, "utf8")) as {
        statusLine?: { type: string; command: string; stack_with_default: boolean }
      }
      expect(settings.statusLine).toBeDefined()
      expect(settings.statusLine?.type).toBe("command")
      expect(settings.statusLine?.command).toContain("statusline.mjs")
      expect(settings.statusLine?.stack_with_default).toBe(true)

      // Second run is idempotent
      const second = await registerAgyPlugin(dir)
      expect(second.alreadyConfigured).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("registerClaudePlugin stages bundles and registers the full statusLine + hook set", async () => {
    const dir = await mkdtemp(join(tmpdir(), "claude-home-"))
    try {
      const res = await registerClaudePlugin(dir)
      expect(existsSync(join(res.pluginDir, "dist", "statusline.mjs"))).toBe(true)
      expect(existsSync(join(res.pluginDir, "dist", "scheduler.mjs"))).toBe(true)
      expect(existsSync(res.settingsPath)).toBe(true)

      const settings = JSON.parse(await readFile(res.settingsPath, "utf8")) as {
        statusLine?: { type: string; command: string; refreshInterval?: number }
        hooks?: Record<string, Array<{ matcher?: string; hooks?: Array<{ type: string; command: string; async?: boolean }> }>>
      }
      // The statusline re-runs on a timer so the busy→idle transition actually
      // paints after the Stop hook fires (event-only updates never re-render).
      expect(settings.statusLine).toBeDefined()
      expect(settings.statusLine?.type).toBe("command")
      expect(settings.statusLine?.command).toContain("statusline.mjs")
      expect(settings.statusLine?.refreshInterval).toBe(10)

      // The full hook set: heartbeats mark busy while the agent works; the
      // turn/session/notification boundaries mark idle.
      const hooks = settings.hooks ?? {}
      const commandsOf = (event: string): string[] =>
        (hooks[event] ?? []).flatMap((g) => (g.hooks ?? []).map((h) => h.command ?? ""))
      for (const event of ["UserPromptSubmit", "PostToolUse", "PostToolUseFailure"]) {
        const commands = commandsOf(event)
        expect(commands.some((c) => c.includes("--heartbeat")), `${event} → --heartbeat`).toBe(true)
      }
      for (const event of ["Stop", "StopFailure", "SessionEnd"]) {
        const commands = commandsOf(event)
        expect(commands.some((c) => c.includes("--idle")), `${event} → --idle`).toBe(true)
      }
      // The 60s idle notification also quiets the card (bounded Esc-interrupt ghost).
      const idleNotifications = (hooks.Notification ?? []).filter((g) => g.matcher === "idle_prompt")
      expect(idleNotifications.some((g) => (g.hooks ?? []).some((h) => h.command?.includes("--idle")))).toBe(true)

      // SessionStart keeps BOTH the data cycle and the quiet-at-startup marker.
      const sessionStartCommands = commandsOf("SessionStart")
      expect(sessionStartCommands.some((c) => c.includes("--cycle"))).toBe(true)
      expect(sessionStartCommands.some((c) => c.includes("--idle"))).toBe(true)

      // Second run is idempotent — no duplicated hook entries.
      const second = await registerClaudePlugin(dir)
      expect(second.alreadyConfigured).toBe(true)
      const secondSettings = JSON.parse(await readFile(res.settingsPath, "utf8")) as {
        hooks?: Record<string, Array<{ hooks?: Array<{ command: string }> }>>
      }
      for (const [event, groups] of Object.entries(secondSettings.hooks ?? {})) {
        const total = groups.reduce((n, g) => n + (g.hooks?.length ?? 0), 0)
        expect(total, `${event} hook count after re-run`).toBeLessThanOrEqual(2)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("TUI physical row calculations", () => {
  it("counts physical rows without off-by-one errors", () => {
    const lines = [
      "  (Use ↑/↓ to navigate • Space to toggle • Enter to confirm)",
      "  │",
      "  ▸ [●] OpenCode             (Prompt-line card & /news reader)",
      "    [●] Google Antigravity   (Statusline hook & dwell-clock)",
      "    [ ] Claude Code          (Wait-state hook · v1.2)",
    ]
    expect(countLinesRows(lines)).toBe(5)
  })

  it("ignores ANSI escape codes when computing row wrapping", () => {
    const plain = ["Short line"]
    const ansi = ["\x1B[1m\x1B[38;5;208mShort line\x1B[0m"]
    expect(countLinesRows(plain)).toBe(1)
    expect(countLinesRows(ansi)).toBe(1)
  })
})

