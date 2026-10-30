// CLI onboarding tests — validates multi-agent detection, configuration,
// and CLI flags for npx waitfeed init.
import { describe, expect, it } from "vitest"
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
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
  removeOpenCodePlugin,
  removeAgyPlugin,
  removeClaudePlugin,
  removeWaitFeedData,
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

      // The /news pane ships inside the staged dir, and init persists it via
      // the env var the mods docs list for runs that can't take --plugin-dir
      // ("Environment, or env in ~/.claude/settings.json").
      const modDir = join(res.pluginDir, "claude-mod")
      for (const rel of [".claude-plugin/plugin.json", "hooks/hooks.json", "hooks/register.js", "README.md"]) {
        expect(existsSync(join(modDir, ...rel.split("/"))), `staged: ${rel}`).toBe(true)
      }
      const env = (settings as { env?: Record<string, string> }).env ?? {}
      expect(env.CLAUDE_CODE_PLUGIN_DIRS, "the pane dir rides CLAUDE_CODE_PLUGIN_DIRS").toContain(
        res.pluginDir.replace(/\\/g, "/") + "/claude-mod",
      )

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

describe("Removal (full teardown)", () => {
  const spawnRemove = (home: string) =>
    spawnSync(process.execPath, [BIN, "remove"], {
      encoding: "utf8",
      // Point os.homedir() at a sandbox for the whole child process:
      // USERPROFILE governs it on Windows, HOME on unix.
      env: { ...process.env, HOME: home, USERPROFILE: home },
    })

  it("opencode: register → remove leaves no waitfeed entry; foreign plugins survive", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wf-rm-oc-"))
    try {
      await writeFile(
        join(dir, "opencode.json"),
        JSON.stringify({ plugins: ["other-plugin"], model: "some-model" }),
        "utf8",
      )
      await registerOpenCodePlugin(dir)
      const mid = JSON.parse(await readFile(join(dir, "opencode.json"), "utf8")) as { plugins: string[] }
      expect(mid.plugins).toContain("waitfeed")

      const res = (await removeOpenCodePlugin(dir)) as { configured: boolean }
      expect(res.configured).toBe(true)
      const after = JSON.parse(await readFile(join(dir, "opencode.json"), "utf8")) as {
        plugins: string[]
        model?: string
      }
      expect(after.plugins).toEqual(["other-plugin"])
      expect(after.model).toBe("some-model")
      expect(JSON.stringify(after)).not.toContain("waitfeed")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("opencode: empty plugins key is dropped (the $schema nicety stays)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wf-rm-oc2-"))
    try {
      await registerOpenCodePlugin(dir) // writes opencode.jsonc: $schema + plugins: ["waitfeed"]
      const res = (await removeOpenCodePlugin(dir)) as { configured: boolean }
      expect(res.configured).toBe(true)
      const after = JSON.parse(await readFile(join(dir, "opencode.jsonc"), "utf8")) as {
        $schema?: string
        plugins?: string[]
      }
      expect(after.plugins).toBeUndefined()
      expect(Object.keys(after)).toEqual(["$schema"])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("opencode: a config that held nothing but waitfeed is deleted outright", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wf-rm-oc3-"))
    try {
      await writeFile(join(dir, "opencode.json"), JSON.stringify({ plugins: ["waitfeed"] }), "utf8")
      const res = (await removeOpenCodePlugin(dir)) as { configured: boolean }
      expect(res.configured).toBe(true)
      expect(existsSync(join(dir, "opencode.json"))).toBe(false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("opencode: missing or malformed config is reported, never rewritten", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wf-rm-oc4-"))
    try {
      const missing = (await removeOpenCodePlugin(dir)) as { configured: boolean }
      expect(missing.configured).toBe(false)

      const badPath = join(dir, "opencode.json")
      await writeFile(badPath, "{ not valid json !!", "utf8")
      const res = (await removeOpenCodePlugin(dir)) as { configured: boolean; unreadable?: boolean }
      expect(res.configured).toBe(false)
      expect(res.unreadable).toBe(true)
      expect(await readFile(badPath, "utf8")).toBe("{ not valid json !!")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("claude: register → remove deletes statusLine, hook groups and staged bundles; foreign hooks survive", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-cl-"))
    try {
      await mkdir(join(home, ".claude"), { recursive: true })
      const settingsPath = join(home, ".claude", "settings.json")
      // A hook that does NOT belong to WaitFeed, as a user would have it.
      await writeFile(
        settingsPath,
        JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "node my-own-tool.js" }] }] } }),
        "utf8",
      )

      await registerClaudePlugin(home)
      const mid = JSON.parse(await readFile(settingsPath, "utf8")) as { statusLine?: { command: string }; env?: Record<string, string> }
      expect(mid.statusLine).toBeDefined()
      expect((mid.env ?? {}).CLAUDE_CODE_PLUGIN_DIRS, "the pane env entry was staged").toContain(
        join(home, ".claude", "waitfeed", "claude-mod").replace(/\\/g, "/"),
      )

      const res = (await removeClaudePlugin(home)) as { configured: boolean }
      expect(res.configured).toBe(true)

      const after = JSON.parse(await readFile(settingsPath, "utf8")) as {
        statusLine?: unknown
        hooks?: Record<string, Array<{ hooks?: Array<{ command: string }> }>>
      }
      expect(after.statusLine).toBeUndefined()
      expect(JSON.stringify(after)).not.toContain("waitfeed")
      // The user's own hook group survives intact.
      expect(after.hooks?.Stop?.[0]?.hooks?.[0]?.command).toBe("node my-own-tool.js")
      // Staged bundles are gone.
      expect(existsSync(join(home, ".claude", "waitfeed"))).toBe(false)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("claude: a mixed hook entry keeps only the foreign command", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-cl2-"))
    try {
      const marker = join(home, ".claude", "waitfeed").replace(/\\/g, "/")
      await mkdir(join(home, ".claude"), { recursive: true })
      const settingsPath = join(home, ".claude", "settings.json")
      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            Stop: [
              {
                hooks: [
                  { type: "command", command: `node ${marker}/dist/scheduler.mjs --idle` },
                  { type: "command", command: "node their-tool.js" },
                ],
              },
            ],
          },
        }),
        "utf8",
      )

      const res = (await removeClaudePlugin(home)) as { configured: boolean }
      expect(res.configured).toBe(true)
      const after = JSON.parse(await readFile(settingsPath, "utf8")) as {
        hooks?: Record<string, Array<{ hooks?: Array<{ command: string }> }>>
      }
      expect(after.hooks?.Stop?.[0]?.hooks?.map((h) => h.command)).toEqual(["node their-tool.js"])
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("claude: the --wf flip variant counts as ours; a foreign statusLine is never touched", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-cl3-"))
    try {
      const marker = join(home, ".claude", "waitfeed").replace(/\\/g, "/")
      await mkdir(join(home, ".claude"), { recursive: true })
      const settingsPath = join(home, ".claude", "settings.json")
      await writeFile(
        settingsPath,
        JSON.stringify({
          statusLine: { type: "command", command: `node ${marker}/dist/statusline.mjs --wf`, refreshInterval: 2 },
        }),
        "utf8",
      )
      const flipped = (await removeClaudePlugin(home)) as { configured: boolean }
      expect(flipped.configured).toBe(true)
      expect(existsSync(settingsPath)).toBe(false) // nothing else was in it

      const original = { statusLine: { type: "command", command: "node my-statusline.js" } }
      await writeFile(settingsPath, JSON.stringify(original), "utf8")
      const foreign = (await removeClaudePlugin(home)) as { configured: boolean }
      expect(foreign.configured).toBe(false)
      expect(JSON.parse(await readFile(settingsPath, "utf8"))).toEqual(original)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("claude: removal cleans our CLAUDE_CODE_PLUGIN_DIRS entry and keeps foreign plugin dirs", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-cl5-"))
    try {
      await registerClaudePlugin(home)
      const settingsPath = join(home, ".claude", "settings.json")
      const mid = JSON.parse(await readFile(settingsPath, "utf8")) as { env?: Record<string, string> }
      const ours = join(home, ".claude", "waitfeed", "claude-mod").replace(/\\/g, "/")
      const SEP = process.platform === "win32" ? ";" : ":"
      // The drive-letter colon must survive: on Windows the separator is `;`.
      mid.env = { CLAUDE_CODE_PLUGIN_DIRS: "C:/their/tools" + SEP + ours, HOME: "C:/Users/them" }
      await writeFile(settingsPath, JSON.stringify(mid), "utf8")

      const res = (await removeClaudePlugin(home)) as { configured: boolean }
      expect(res.configured, "an env entry of ours counts as configured").toBe(true)
      const after = JSON.parse(await readFile(settingsPath, "utf8")) as { env?: Record<string, string> }
      expect(after.env?.CLAUDE_CODE_PLUGIN_DIRS).toBe("C:/their/tools")
      expect(after.env?.HOME).toBe("C:/Users/them")
      expect(existsSync(join(home, ".claude", "waitfeed", "claude-mod"))).toBe(false)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("claude: a malformed settings.json is reported, never rewritten", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-cl4-"))
    try {
      await mkdir(join(home, ".claude"), { recursive: true })
      const settingsPath = join(home, ".claude", "settings.json")
      await writeFile(settingsPath, "{ broken", "utf8")
      const res = (await removeClaudePlugin(home)) as { configured: boolean; unreadable?: boolean }
      expect(res.configured).toBe(false)
      expect(res.unreadable).toBe(true)
      expect(await readFile(settingsPath, "utf8")).toBe("{ broken")
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("agy: register → remove deletes statusLine and the staged plugin dir", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-agy-"))
    try {
      await registerAgyPlugin(home)
      const settingsPath = join(home, ".gemini", "antigravity-cli", "settings.json")
      expect(existsSync(join(home, ".gemini", "config", "plugins", "waitfeed", "plugin.json"))).toBe(true)

      const res = (await removeAgyPlugin(home)) as { configured: boolean }
      expect(res.configured).toBe(true)
      expect(existsSync(join(home, ".gemini", "config", "plugins", "waitfeed"))).toBe(false)
      // settings.json held only the statusLine → deleted outright (empty husk)
      expect(existsSync(settingsPath)).toBe(false)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("agy: a foreign statusLine is never touched", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-rm-agy2-"))
    try {
      await mkdir(join(home, ".gemini", "antigravity-cli"), { recursive: true })
      const settingsPath = join(home, ".gemini", "antigravity-cli", "settings.json")
      const original = { statusLine: { type: "command", command: "node my-statusline.js" }, theme: "dark" }
      await writeFile(settingsPath, JSON.stringify(original), "utf8")

      const res = (await removeAgyPlugin(home)) as { configured: boolean }
      expect(res.configured).toBe(false)
      expect(JSON.parse(await readFile(settingsPath, "utf8"))).toEqual(original)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })

  it("removeWaitFeedData deletes the shared data dir and is idempotent", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wf-rm-data-"))
    try {
      await saveWaitFeedUserConfig({ hn: true }, [], dir)
      expect(existsSync(join(dir, "config.json"))).toBe(true)

      const res = (await removeWaitFeedData(dir)) as { removed: boolean }
      expect(res.removed).toBe(true)
      expect(existsSync(dir)).toBe(false)

      const again = (await removeWaitFeedData(dir)) as { removed: boolean }
      expect(again.removed).toBe(false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("CLI remove reports per-host results against a faked home (E2E)", () => {
    const home = mkdtempSync(join(tmpdir(), "wf-rm-e2e-"))
    try {
      const res = spawnRemove(home)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain("OpenCode: not configured")
      expect(res.stdout).toContain("Google Antigravity (AGY): not configured")
      expect(res.stdout).toContain("Claude Code: not configured")
      expect(res.stdout).toContain("No data folder")
      expect(res.stdout).toContain("WaitFeed fully removed")
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })

  it("full round-trip: register everything → CLI remove leaves zero waitfeed traces", async () => {
    const home = await mkdtemp(join(tmpdir(), "wf-roundtrip-"))
    try {
      const dataDir = join(home, ".config", "waitfeed")
      await saveWaitFeedUserConfig({ hn: true, devto: true, github: true, reddit: true }, [], dataDir)
      await registerOpenCodePlugin(join(home, ".config", "opencode"))
      await registerAgyPlugin(home)
      await registerClaudePlugin(home)

      const res = spawnRemove(home)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain("OpenCode: integration removed")
      expect(res.stdout).toContain("Google Antigravity (AGY): integration removed")
      expect(res.stdout).toContain("Claude Code: integration removed")

      expect(existsSync(dataDir)).toBe(false)
      expect(existsSync(join(home, ".claude", "waitfeed"))).toBe(false)
      expect(existsSync(join(home, ".gemini", "config", "plugins", "waitfeed"))).toBe(false)

      // And not a single leftover file under the faked home mentions waitfeed.
      const walk = (dir: string): string[] =>
        existsSync(dir)
          ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
              e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
            )
          : []
      const files = walk(home)
      expect(files.length).toBeGreaterThan(0) // sanity: the scan actually looked
      for (const file of files) {
        const text = await readFile(file, "utf8").catch(() => "")
        expect(text.toLowerCase()).not.toContain("waitfeed")
      }
    } finally {
      await rm(home, { recursive: true, force: true })
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

