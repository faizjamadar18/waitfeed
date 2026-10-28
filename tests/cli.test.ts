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
  it("--help prints the usage with the product tagline", () => {
    const res = spawnSync(process.execPath, [BIN, "--help"], { encoding: "utf8" })
    expect(res.status).toBe(0)
    expect(res.stdout).toContain("WaitFeed")
    expect(res.stdout).toContain("Make Every Agent Wait Count")
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
      // The statusline re-runs on a timer so the ledger transitions actually
      // paint — event-only updates never re-render. At 2s the timer ALSO
      // covers the two waits the events can't paint: Enter (no statusline
      // trigger at submit — the card must not wait for the first assistant
      // message) and the moment a question/permission wait ends.
      expect(settings.statusLine).toBeDefined()
      expect(settings.statusLine?.type).toBe("command")
      expect(settings.statusLine?.command).toContain("statusline.mjs")
      expect(settings.statusLine?.refreshInterval).toBe(2)

      // The full hook set: heartbeats mark busy while the agent works; the
      // turn/session/notification boundaries mark idle.
      const hooks = settings.hooks ?? {}
      const commandsOf = (event: string): string[] =>
        (hooks[event] ?? []).flatMap((g) => (g.hooks ?? []).map((h) => h.command ?? ""))
      for (const event of ["UserPromptSubmit", "PostToolUse", "PostToolUseFailure"]) {
        const commands = commandsOf(event)
        expect(commands.some((c) => c.includes("--heartbeat")), `${event} → --heartbeat`).toBe(true)
      }
      // Turn/session boundaries quiet the card; so does the agent asking for
      // permission — waiting on the user is not executing.
      for (const event of ["Stop", "StopFailure", "SessionEnd", "PermissionRequest"]) {
        const commands = commandsOf(event)
        expect(commands.some((c) => c.includes("--idle")), `${event} → --idle`).toBe(true)
      }
      // The question tool waits on the user the moment it starts — PreToolUse
      // fires BEFORE the tool blocks, so the card quiets while it asks.
      const askQuiet = (hooks.PreToolUse ?? []).some(
        (g) => g.matcher === "AskUserQuestion" && (g.hooks ?? []).some((h) => h.command?.includes("--idle")),
      )
      expect(askQuiet, "PreToolUse AskUserQuestion → --idle").toBe(true)
      // MCP elicitation dialogs are questions to the user too.
      for (const matcher of ["elicitation_dialog", "elicitation_url_dialog"]) {
        const elicitation = (hooks.Notification ?? []).filter((g) => g.matcher === matcher)
        expect(elicitation.some((g) => (g.hooks ?? []).some((h) => h.command?.includes("--idle"))), matcher).toBe(true)
      }
      // A DENIED permission hands control back to the agent — busy again.
      const deniedCommands = commandsOf("PermissionDenied")
      expect(deniedCommands.some((c) => c.includes("--heartbeat")), "PermissionDenied → --heartbeat").toBe(true)
      // The 60s idle notification also quiets the card (bounded Esc-interrupt ghost).
      const idleNotifications = (hooks.Notification ?? []).filter((g) => g.matcher === "idle_prompt")
      expect(idleNotifications.some((g) => (g.hooks ?? []).some((h) => h.command?.includes("--idle")))).toBe(true)

      // SessionStart keeps BOTH the data cycle and the quiet-at-startup marker.
      const sessionStartCommands = commandsOf("SessionStart")
      expect(sessionStartCommands.some((c) => c.includes("--cycle"))).toBe(true)
      expect(sessionStartCommands.some((c) => c.includes("--idle"))).toBe(true)
      // The transcript watcher: SessionStart seeds it; FileChanged turns the
      // interrupt-marker write (Esc — no hook of its own) into an instant
      // hide: ledger idle + the instant-paint flip.
      expect(sessionStartCommands.some((c) => c.includes("--watch")), "SessionStart → --watch").toBe(true)
      expect(commandsOf("FileChanged").some((c) => c.includes("--interrupt-check")), "FileChanged → --interrupt-check").toBe(true)

      // Second run is idempotent — the hook set comes back byte-identical.
      const second = await registerClaudePlugin(dir)
      expect(second.alreadyConfigured).toBe(true)
      const secondSettings = JSON.parse(await readFile(res.settingsPath, "utf8")) as {
        hooks?: Record<string, Array<{ hooks?: Array<{ command: string }> }>>
      }
      expect(secondSettings.hooks).toEqual(hooks)

      // The hook flips the stored command at runtime (" --wf" suffix) to
      // repaint the card instantly on busy↔idle transitions; init must treat
      // that as configured — a rewrite back would itself trigger an instant
      // statusline re-run on every init.
      const withFlip = JSON.parse(await readFile(res.settingsPath, "utf8")) as { statusLine?: { command: string } }
      withFlip.statusLine!.command += " --wf"
      await writeFile(res.settingsPath, JSON.stringify(withFlip, null, 2) + "\n", "utf8")
      const third = await registerClaudePlugin(dir)
      expect(third.alreadyConfigured).toBe(true)
      const thirdSettings = JSON.parse(await readFile(res.settingsPath, "utf8")) as { statusLine?: { command: string } }
      expect(thirdSettings.statusLine?.command.endsWith(" --wf"), "flip variant survives a re-run of init").toBe(true)
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

