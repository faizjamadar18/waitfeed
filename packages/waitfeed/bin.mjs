#!/usr/bin/env node

/**
 * WaitFeed CLI Onboarding Wizard (npx waitfeed init)
 *
 * 100% local, zero-backend, keyless setup for AI coding agents.
 * Supports OpenCode, Google Antigravity (AGY), and Claude Code (extensible provider architecture).
 */

import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

// --- Terminal Styling & Formatting Helpers ---
const isTTY = Boolean(process.stdout.isTTY)
const c = {
  reset: isTTY ? "\x1B[0m" : "",
  bold: isTTY ? "\x1B[1m" : "",
  dim: isTTY ? "\x1B[90m" : "",
  orange: isTTY ? "\x1B[38;5;208m" : "",
  green: isTTY ? "\x1B[32m" : "",
  cyan: isTTY ? "\x1B[36m" : "",
  yellow: isTTY ? "\x1B[33m" : "",
  white: isTTY ? "\x1B[37m" : "",
}

const HIDE_CURSOR = isTTY ? "\x1B[?25l" : ""
const SHOW_CURSOR = isTTY ? "\x1B[?25h" : ""

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")
}

function countLinesRows(lines) {
  const cols = Math.max(20, process.stdout.columns || 80)
  let total = 0
  for (const line of lines) {
    const len = stripAnsi(line).length
    total += Math.max(1, Math.ceil(len / cols))
  }
  return total
}

function eraseBlock(rowCount) {
  if (!isTTY || rowCount <= 0) return
  readline.cursorTo(process.stdout, 0)
  for (let i = 0; i < rowCount; i++) {
    readline.moveCursor(process.stdout, 0, -1)
    readline.clearLine(process.stdout, 0)
  }
}

function isBinaryInPath(bin) {
  try {
    const cmd = process.platform === "win32" ? `where.exe ${bin}` : `which ${bin}`
    execSync(cmd, { stdio: ["pipe", "pipe", "ignore"] })
    return true
  } catch {
    return false
  }
}

// --- Environment Detection ---
function detectOpenCode() {
  const binary = isBinaryInPath("opencode")
  const configDir = join(homedir(), ".config", "opencode")
  const configExists = existsSync(configDir)
  return {
    installed: binary || configExists,
    binary,
    configExists,
  }
}

function detectAgy() {
  const binary = isBinaryInPath("agy")
  const geminiDir = join(homedir(), ".gemini")
  const cliDir = join(geminiDir, "antigravity-cli")
  const exists = existsSync(cliDir) || existsSync(geminiDir)
  return {
    installed: binary || exists,
    binary,
    exists,
  }
}

function detectClaude() {
  const binary = isBinaryInPath("claude")
  const claudeDir = join(homedir(), ".claude")
  const exists = existsSync(claudeDir)
  return {
    installed: binary || exists,
    binary,
    exists,
  }
}

// --- OpenCode Config Utilities ---
function stripJsoncComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^\\:])\/\/.*$/gm, "$1")
    .trim()
}

function resolveOpenCodeConfigPath(baseDir) {
  const opencodeDir = baseDir || join(homedir(), ".config", "opencode")
  const jsoncPath = join(opencodeDir, "opencode.jsonc")
  const jsonPath = join(opencodeDir, "opencode.json")

  if (existsSync(jsoncPath)) return jsoncPath
  if (existsSync(jsonPath)) return jsonPath
  return jsoncPath
}

async function registerOpenCodePlugin(customDir) {
  const opencodeDir = customDir || join(homedir(), ".config", "opencode")
  const configPath = resolveOpenCodeConfigPath(opencodeDir)
  await mkdir(opencodeDir, { recursive: true })

  let currentConfig = {}
  let exists = false

  if (existsSync(configPath)) {
    try {
      const raw = await readFile(configPath, "utf8")
      const clean = stripJsoncComments(raw)
      if (clean) currentConfig = JSON.parse(clean)
      exists = true
    } catch {
      currentConfig = {}
    }
  }

  const plugins = Array.isArray(currentConfig.plugins) ? [...currentConfig.plugins] : []
  const alreadyRegistered = plugins.includes("waitfeed")

  if (!alreadyRegistered) {
    plugins.push("waitfeed")
    currentConfig.plugins = plugins

    if (!currentConfig.$schema) {
      currentConfig = {
        $schema: "https://opencode.ai/config.json",
        ...currentConfig,
      }
    }

    await writeFile(configPath, JSON.stringify(currentConfig, null, 2) + "\n", "utf8")
  }

  return { configPath, alreadyRegistered, exists }
}

// --- Antigravity (AGY) Config Utilities ---
async function registerAgyPlugin(customHome) {
  const home = customHome || homedir()
  const pluginDir = join(home, ".gemini", "config", "plugins", "waitfeed")
  const distDir = join(pluginDir, "dist")
  const cliDir = join(home, ".gemini", "antigravity-cli")
  const settingsPath = join(cliDir, "settings.json")

  await mkdir(distDir, { recursive: true })
  await mkdir(cliDir, { recursive: true })

  // 1. Stage shipped plugin assets into ~/.gemini/config/plugins/waitfeed
  const sourceAgyDir = fileURLToPath(new URL("./agy", import.meta.url))
  const filesToStage = [
    { src: join(sourceAgyDir, "plugin.json"), dest: join(pluginDir, "plugin.json") },
    { src: join(sourceAgyDir, "hooks.json"), dest: join(pluginDir, "hooks.json") },
    { src: join(sourceAgyDir, "dist", "scheduler.mjs"), dest: join(distDir, "scheduler.mjs") },
    { src: join(sourceAgyDir, "dist", "statusline.mjs"), dest: join(distDir, "statusline.mjs") },
  ]

  let stagedCount = 0
  for (const { src, dest } of filesToStage) {
    if (existsSync(src)) {
      await copyFile(src, dest)
      stagedCount++
    }
  }

  // 2. Configure statusLine in ~/.gemini/antigravity-cli/settings.json
  let settings = {}
  let settingsExisted = false
  if (existsSync(settingsPath)) {
    try {
      const raw = await readFile(settingsPath, "utf8")
      const clean = stripJsoncComments(raw)
      if (clean) settings = JSON.parse(clean)
      settingsExisted = true
    } catch {
      settings = {}
    }
  }

  const targetStatuslinePath = join(distDir, "statusline.mjs").replace(/\\/g, "/")
  const desiredCommand = `node ${targetStatuslinePath}`
  const alreadyConfigured =
    settings.statusLine &&
    typeof settings.statusLine === "object" &&
    settings.statusLine.command === desiredCommand

  if (!alreadyConfigured) {
    settings.statusLine = {
      type: "command",
      command: desiredCommand,
      stack_with_default: true,
    }
    await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8")
  }

  return {
    pluginDir,
    settingsPath,
    stagedCount,
    alreadyConfigured,
    settingsExisted,
  }
}

// --- WaitFeed Shared Config Utilities ---
async function saveWaitFeedUserConfig(sources, rssUrls, customDir) {
  const dir = customDir || join(homedir(), ".config", "waitfeed")
  await mkdir(dir, { recursive: true })
  const configPath = join(dir, "config.json")

  const config = {
    setupDone: true,
    sources,
    rssUrls,
    dwellSeconds: 20,
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8")
  return configPath
}

// --- Generic Interactive Multi-Select Helper ---
async function promptMultiSelect({ hint, items }) {
  if (!isTTY) {
    const result = {}
    for (const item of items) {
      if (!item.disabled) {
        result[item.key] = Boolean(item.enabled)
      }
    }
    return result
  }

  let cursorIndex = 0
  const state = items.map((it) => ({ ...it }))
  let renderedRowCount = 0

  function renderList() {
    const lines = []
    if (hint) {
      lines.push(`  ${c.dim}${hint}${c.reset}`)
      lines.push(`  ${c.dim}│${c.reset}`)
    }

    for (let i = 0; i < state.length; i++) {
      const item = state[i]
      const isSelected = i === cursorIndex
      const pointer = isSelected ? `${c.orange}▸${c.reset}` : " "

      let checkbox = ""
      if (item.disabled) {
        checkbox = `${c.dim}[ ]${c.reset}`
      } else if (item.enabled) {
        checkbox = `${c.green}[●]${c.reset}`
      } else {
        checkbox = `${c.dim}[○]${c.reset}`
      }

      // Format padding on raw unstyled name so ANSI escape codes don't shift columns
      const rawName = item.name.padEnd(20)
      let styledName = ""
      if (item.disabled) {
        styledName = `${c.dim}${rawName}${c.reset}`
      } else if (isSelected) {
        styledName = `${c.bold}${c.white}${rawName}${c.reset}`
      } else {
        styledName = `${c.white}${rawName}${c.reset}`
      }

      const desc = item.desc ? ` ${c.dim}(${item.desc})${c.reset}` : ""
      const badge = item.badge ? ` ${c.cyan}${item.badge}${c.reset}` : ""

      lines.push(`  ${pointer} ${checkbox} ${styledName}${desc}${badge}`)
    }
    return lines
  }

  function draw() {
    eraseBlock(renderedRowCount)
    const lines = renderList()
    process.stdout.write(lines.join("\n") + "\n")
    renderedRowCount = countLinesRows(lines)
  }

  process.stdout.write(HIDE_CURSOR)
  draw()

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
      process.stdin.resume()
    }

    const mountedAt = Date.now()
    const onResize = () => draw()
    process.stdout.on("resize", onResize)

    function cleanup() {
      process.stdout.removeListener("resize", onResize)
      if (process.stdin.isTTY) process.stdin.setRawMode(false)
      process.stdin.removeListener("keypress", onKeyPress)
      eraseBlock(renderedRowCount)
      process.stdout.write(SHOW_CURSOR)
    }

    function onKeyPress(str, key) {
      if (key && key.ctrl && key.name === "c") {
        cleanup()
        process.exit(0)
      }

      if (key && (key.name === "return" || key.name === "enter")) {
        // Prevent accidental double-submit or key bounce across sequential prompts
        if (Date.now() - mountedAt < 150) return

        cleanup()
        const result = {}
        for (const item of state) {
          if (!item.disabled) {
            result[item.key] = Boolean(item.enabled)
          }
        }
        resolve(result)
        return
      }

      if (key && (key.name === "up" || key.name === "k")) {
        cursorIndex = cursorIndex > 0 ? cursorIndex - 1 : state.length - 1
        draw()
      } else if (key && (key.name === "down" || key.name === "j")) {
        cursorIndex = cursorIndex < state.length - 1 ? cursorIndex + 1 : 0
        draw()
      } else if (key && key.name === "space") {
        if (!state[cursorIndex].disabled) {
          state[cursorIndex].enabled = !state[cursorIndex].enabled
          draw()
        }
      }
    }

    process.stdin.on("keypress", onKeyPress)
  })
}

// --- Interactive Channel List ---
const CHANNELS = [
  { key: "hn", name: "Hacker News", desc: "Tech & startups", enabled: true },
  { key: "devto", name: "Dev.to", desc: "Articles & tutorials", enabled: true },
  { key: "github", name: "GitHub Trending", desc: "Open source projects", enabled: true },
  { key: "reddit", name: "Reddit", desc: "r/programming discussions", enabled: true },
]

async function promptRss() {
  if (!isTTY) return []

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`  ${c.dim}>${c.reset} `, (answer) => {
      rl.close()
      const trimmed = answer.trim()
      if (trimmed && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
        resolve([trimmed])
      } else {
        resolve([])
      }
    })
  })
}

// --- Main CLI Execution ---
async function runInit() {
  console.log()
  console.log(`  ${c.dim}• WAITFEED INIT ────────────────────────────────────────────── 01${c.reset}`)
  console.log(`  ${c.orange}${c.bold}█ █ █  ▄▀█  █  ▀█▀  █▀▀  █▀▀  █▀▀  █▀▄${c.reset}`)
  console.log(`  ${c.orange}${c.bold}▀▄█▄▀  █▀█  █   █   █▀   ██▄  ██▄  █▄▀${c.reset}`)
  console.log(`  ${c.white}Real-time news ticker inside your AI coding agent wait time${c.reset}`)
  console.log(`  ${c.dim}100% local · no ads · no accounts · zero API keys${c.reset}`)
  console.log(`  ${c.dim}─────────────────────────────────────────────────────────────${c.reset}`)
  console.log()

  // 1. Detect Agent Environments
  console.log(`  ${c.dim}Scanning system for AI coding agent environments...${c.reset}`)
  const opencodeStatus = detectOpenCode()
  const agyStatus = detectAgy()
  const claudeStatus = detectClaude()

  if (opencodeStatus.installed) {
    console.log(`  ${c.green}◆${c.reset} OpenCode: ${c.white}detected${c.reset}`)
  } else {
    console.log(`  ${c.dim}◇ OpenCode: not detected${c.reset}`)
  }

  if (agyStatus.installed) {
    console.log(`  ${c.green}◆${c.reset} Google Antigravity (AGY): ${c.white}detected${c.reset}`)
  } else {
    console.log(`  ${c.dim}◇ Google Antigravity (AGY): not detected${c.reset}`)
  }

  if (claudeStatus.installed) {
    console.log(`  ${c.yellow}◇${c.reset} Claude Code: ${c.dim}detected (adapter releases in v1.2)${c.reset}`)
  } else {
    console.log(`  ${c.dim}◇ Claude Code: adapter coming soon in v1.2${c.reset}`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 2. Interactive Agent Provider Selection
  // If neither detected, enable OpenCode and AGY by default for user discovery.
  const hasAnyDetected = opencodeStatus.installed || agyStatus.installed
  const defaultOpenCode = hasAnyDetected ? opencodeStatus.installed : true
  const defaultAgy = hasAnyDetected ? agyStatus.installed : true

  const agentItems = [
    {
      key: "opencode",
      name: "OpenCode",
      desc: "Prompt-line card & /news reader",
      enabled: defaultOpenCode,
    },
    {
      key: "agy",
      name: "Google Antigravity",
      desc: "Statusline hook & dwell-clock",
      enabled: defaultAgy,
    },
    {
      key: "claude",
      name: "Claude Code",
      desc: "Wait-state hook (coming soon)",
      enabled: false,
      disabled: true,
      badge: "[v1.2]",
    },
  ]

  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Which AI coding agent(s) would you like to configure?${c.reset}`)
  const selectedAgents = await promptMultiSelect({
    hint: "(Use ↑/↓ to navigate • Space to select/unselect • Enter to confirm)",
    items: agentItems,
  })

  const enabledAgentNames = agentItems
    .filter((a) => selectedAgents[a.key])
    .map((a) => a.name)

  console.log(
    `  ${c.green}◆${c.reset} Configured agents: ${c.white}${enabledAgentNames.join(", ") || "None (shared preferences only)"}${c.reset}`
  )
  console.log(`  ${c.dim}│${c.reset}`)

  // 3. Interactive Channel Selection
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Which news channels would you like in your rotation?${c.reset}`)
  const sources = await promptMultiSelect({
    hint: "(Use ↑/↓ to navigate • Space to select/unselect • Enter to confirm)",
    items: CHANNELS,
  })
  const enabledChannelNames = CHANNELS.filter((ch) => sources[ch.key]).map((ch) => ch.name)
  console.log(
    `  ${c.green}◆${c.reset} Active channels: ${c.white}${enabledChannelNames.join(", ") || "None (RSS only)"}${c.reset}`
  )
  console.log(`  ${c.dim}│${c.reset}`)

  // 4. Optional Custom RSS Feed URL
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Add a custom RSS feed URL?${c.reset} ${c.dim}(press Enter to skip)${c.reset}`)
  const rssUrls = await promptRss()
  if (rssUrls.length > 0) {
    console.log(`  ${c.green}◆${c.reset} Custom RSS added: ${c.white}${rssUrls[0]}${c.reset}`)
  } else {
    console.log(`  ${c.dim}◆ Custom RSS: skipped${c.reset}`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 5. Save Shared User Preferences & Register Integrations
  await saveWaitFeedUserConfig(sources, rssUrls)
  console.log(`  ${c.green}✓${c.reset} Preferences saved`)

  if (selectedAgents.opencode) {
    await registerOpenCodePlugin()
    console.log(`  ${c.green}✓${c.reset} OpenCode integration active`)
  }

  if (selectedAgents.agy) {
    await registerAgyPlugin()
    console.log(`  ${c.green}✓${c.reset} Google Antigravity (AGY) integration active`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 6. Single Unified Live Card Preview
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Live Ticker Preview (what you will see while your agent works):${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)
  console.log(`  ${c.dim}│  ┌───────────────────────────────────────────────────────────────┐${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset} ${c.orange}${c.bold}▍ [HN]${c.reset}  ${c.bold}${c.white}SWE-bench: Evaluating AI coding agents${c.reset}    ${c.orange}▲ 1.2k${c.reset}${c.dim} · 2h${c.reset} ${c.dim}│${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}Autonomous agents resolve real GitHub bugs and pass        │${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}full test suites without human intervention.               │${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}> ${c.cyan}swebench.com${c.reset}${c.dim}                                             │${c.reset}`)
  console.log(`  ${c.dim}│  └───────────────────────────────────────────────────────────────┘${c.reset}`)
  console.log(`  ${c.dim}│  ↳ Renders above prompt in OpenCode and in the AGY statusline${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)

  // 7. Completion Box & Tailored Instructions
  console.log(`  ${c.cyan}◇ What to do next ─────────────────────────────────────────────────┐${c.reset}`)
  if (selectedAgents.opencode) {
    console.log(`  ${c.dim}│${c.reset} • ${c.bold}OpenCode:${c.reset} Start ${c.white}opencode${c.reset} — ticker appears when agent works.  ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset}   Type ${c.bold}/news${c.reset} anytime to open the fullscreen reader.             ${c.dim}│${c.reset}`)
  }
  if (selectedAgents.agy) {
    console.log(`  ${c.dim}│${c.reset} • ${c.bold}Antigravity (AGY):${c.reset} Start ${c.white}agy${c.reset} — statusline ticker rotates.    ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset}   Ctrl+Click origin links to open stories in your browser.        ${c.dim}│${c.reset}`)
  }
  console.log(`  ${c.dim}│${c.reset} • Start typing your prompt anytime — the ticker vanishes!         ${c.dim}│${c.reset}`)
  console.log(`  ${c.cyan}└──────────────────────────────────────────────────────────────────┘${c.reset}`)
  console.log()
  console.log(`  ${c.green}✓ WaitFeed setup complete! Happy coding.${c.reset}`)
  console.log()
  if (process.stdin.isTTY) {
    process.stdin.pause()
  }
}

function printHelp() {
  console.log(`
  ${c.bold}WaitFeed${c.reset} - Real-time news ticker for AI coding agents
  Supports: OpenCode, Google Antigravity (AGY), Claude Code (coming soon)

  ${c.bold}Usage:${c.reset}
    npx waitfeed init      Run the interactive setup wizard
    npx waitfeed --help    Show this help message
    npx waitfeed --version Show version
`)
}

async function main() {
  const arg = (process.argv[2] || "").toLowerCase()

  if (arg === "--help" || arg === "-h" || arg === "help") {
    printHelp()
    return
  }

  if (arg === "--version" || arg === "-v" || arg === "version") {
    try {
      const pkgPath = new URL("./package.json", import.meta.url)
      const pkg = JSON.parse(await readFile(pkgPath, "utf8"))
      console.log(`waitfeed v${pkg.version}`)
    } catch {
      console.log("waitfeed v1.1.0")
    }
    return
  }

  // Default behavior or "init": run the onboarding flow
  await runInit()
}

// Export for programmatic testing
export {
  detectOpenCode,
  detectAgy,
  detectClaude,
  registerOpenCodePlugin,
  registerAgyPlugin,
  saveWaitFeedUserConfig,
  resolveOpenCodeConfigPath,
  stripJsoncComments,
  countLinesRows,
  eraseBlock,
}

// If invoked as CLI entry
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`\n  ${c.orange}Error during WaitFeed setup:${c.reset}`, err.message)
    process.exit(1)
  })
}
