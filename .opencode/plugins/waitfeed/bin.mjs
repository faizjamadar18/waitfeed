#!/usr/bin/env node

/**
 * WaitFeed CLI Onboarding Wizard (npx waitfeed init)
 *
 * 100% local, zero-backend, keyless setup for OpenCode.
 * Configures ~/.config/waitfeed/config.json and registers the plugin
 * in ~/.config/opencode/opencode.jsonc.
 */

import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import readline from "node:readline"

function isOpenCodeInPath() {
  try {
    const cmd = process.platform === "win32" ? "where.exe opencode" : "which opencode"
    execSync(cmd, { stdio: ["pipe", "pipe", "ignore"] })
    return true
  } catch {
    return false
  }
}

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

function countPhysicalRows(text) {
  const cols = Math.max(20, process.stdout.columns || 80)
  let total = 0
  for (const line of text.split("\n")) {
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
  readline.clearScreenDown(process.stdout)
}

// --- OpenCode Config Utilities ---
function stripJsoncComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^\\:])\/\/.*$/gm, "$1")
    .trim()
}

function resolveOpenCodeConfigPath() {
  const opencodeDir = join(homedir(), ".config", "opencode")
  const jsoncPath = join(opencodeDir, "opencode.jsonc")
  const jsonPath = join(opencodeDir, "opencode.json")

  if (existsSync(jsoncPath)) return jsoncPath
  if (existsSync(jsonPath)) return jsonPath
  return jsoncPath
}

async function registerOpenCodePlugin() {
  const configPath = resolveOpenCodeConfigPath()
  const dir = join(homedir(), ".config", "opencode")
  await mkdir(dir, { recursive: true })

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

// --- WaitFeed Config Utilities ---
async function saveWaitFeedUserConfig(sources, rssUrls) {
  const dir = join(homedir(), ".config", "waitfeed")
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

// --- Interactive Channel Multi-Select ---
const CHANNELS = [
  { key: "hn", name: "Hacker News", desc: "Tech & startups", enabled: true },
  { key: "devto", name: "Dev.to", desc: "Articles & tutorials", enabled: true },
  { key: "github", name: "GitHub Trending", desc: "Open source projects", enabled: true },
  { key: "reddit", name: "Reddit", desc: "r/programming discussions", enabled: true },
]

async function promptChannels() {
  if (!isTTY) {
    // Non-interactive fallback: all channels enabled by default
    return { hn: true, devto: true, github: true, reddit: true }
  }

  let cursorIndex = 0
  const state = [...CHANNELS]
  let renderedRowCount = 0

  function renderList() {
    const lines = []
    lines.push(`  ${c.dim}(Use ↑/↓ to navigate • Space to select/unselect • Enter to confirm)${c.reset}`)
    lines.push(`  ${c.dim}│${c.reset}`)

    for (let i = 0; i < state.length; i++) {
      const item = state[i]
      const isSelected = i === cursorIndex
      const pointer = isSelected ? `${c.orange}▸${c.reset}` : " "
      const checkbox = item.enabled ? `${c.green}[●]${c.reset}` : `${c.dim}[○]${c.reset}`
      const name = isSelected ? `${c.bold}${c.white}${item.name}${c.reset}` : `${c.white}${item.name}${c.reset}`
      const desc = `${c.dim}(${item.desc})${c.reset}`

      lines.push(`  ${pointer} ${checkbox} ${name.padEnd(18)} ${desc}`)
    }
    return lines.join("\n") + "\n"
  }

  function draw() {
    eraseBlock(renderedRowCount)
    const text = renderList()
    process.stdout.write(text)
    renderedRowCount = countPhysicalRows(text)
  }

  process.stdout.write(HIDE_CURSOR)
  draw()

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) process.stdin.setRawMode(true)

    const onResize = () => {
      draw()
    }
    process.stdout.on("resize", onResize)

    function cleanup() {
      process.stdout.removeListener("resize", onResize)
      process.stdin.setRawMode(false)
      process.stdin.removeListener("keypress", onKeyPress)
      eraseBlock(renderedRowCount)
      process.stdout.write(SHOW_CURSOR)
    }

    function onKeyPress(str, key) {
      if (key && (key.ctrl && key.name === "c")) {
        cleanup()
        process.exit(0)
      }

      if (key.name === "up" || key.name === "k") {
        cursorIndex = cursorIndex > 0 ? cursorIndex - 1 : state.length - 1
        draw()
      } else if (key.name === "down" || key.name === "j") {
        cursorIndex = cursorIndex < state.length - 1 ? cursorIndex + 1 : 0
        draw()
      } else if (key.name === "space") {
        state[cursorIndex].enabled = !state[cursorIndex].enabled
        draw()
      } else if (key.name === "return" || key.name === "enter") {
        cleanup()
        const result = {}
        for (const item of state) {
          result[item.key] = item.enabled
        }
        resolve(result)
        return
      }
    }

    process.stdin.on("keypress", onKeyPress)
  })
}

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
  console.log(`  ${c.white}Real-time news ticker inside OpenCode agent wait time${c.reset}`)
  console.log(`  ${c.dim}100% local · no ads · no accounts · zero API keys${c.reset}`)
  console.log(`  ${c.dim}─────────────────────────────────────────────────────────────${c.reset}`)
  console.log()

  // 1. Detect OpenCode Environment & Register Plugin
  const hasBinary = isOpenCodeInPath()
  const { configPath, alreadyRegistered } = await registerOpenCodePlugin()
  const displayConfigPath = configPath.replace(homedir(), "~")

  if (hasBinary) {
    console.log(`  ${c.green}◆${c.reset} OpenCode detected on system`)
  } else {
    console.log(`  ${c.yellow}◇${c.reset} OpenCode binary not found in PATH`)
    console.log(`  ${c.dim}  ↳ Install OpenCode: ${c.white}npm i -g opencode${c.reset} ${c.dim}(https://opencode.ai)${c.reset}`)
  }

  console.log(`  ${c.green}◆${c.reset} OpenCode config: ${c.bold}${displayConfigPath}${c.reset}`)
  if (alreadyRegistered) {
    console.log(`  ${c.dim}  ↳ Plugin "waitfeed" already active in plugins list${c.reset}`)
  } else {
    console.log(`  ${c.dim}  ↳ Added "waitfeed" to OpenCode plugins (ready on next launch)${c.reset}`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 2. Interactive Channel Multi-Select
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Which news channels would you like in your rotation?${c.reset}`)
  const sources = await promptChannels()
  const enabledNames = CHANNELS.filter((ch) => sources[ch.key]).map((ch) => ch.name)
  console.log(`  ${c.green}◆${c.reset} Active channels: ${c.white}${enabledNames.join(", ") || "None (RSS only)"}${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)

  // 3. Optional Custom RSS Feed URL
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Add a custom RSS feed URL?${c.reset} ${c.dim}(press Enter to skip)${c.reset}`)
  const rssUrls = await promptRss()
  if (rssUrls.length > 0) {
    console.log(`  ${c.green}◆${c.reset} Custom RSS added: ${c.white}${rssUrls[0]}${c.reset}`)
  } else {
    console.log(`  ${c.dim}◆ Custom RSS: skipped${c.reset}`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 4. Save Config
  const savedPath = await saveWaitFeedUserConfig(sources, rssUrls)
  const displaySavedPath = savedPath.replace(homedir(), "~")
  console.log(`  ${c.green}◆${c.reset} Preferences saved: ${c.bold}${displaySavedPath}${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)

  // 5. Live Slot Card Preview
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Live ticker card preview (renders above OpenCode input box):${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)
  console.log(`  ${c.dim}│  ┌───────────────────────────────────────────────────────────────┐${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset} ${c.orange}${c.bold}▍ [HN]${c.reset}  ${c.bold}${c.white}SWE-bench: Evaluating AI coding agents${c.reset}    ${c.orange}▲ 1.2k${c.reset}${c.dim} · 2h${c.reset} ${c.dim}│${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}Autonomous agents resolve real GitHub bugs and pass        │${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}full test suites without human intervention.               │${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}> ${c.cyan}swebench.com${c.reset}${c.dim}                                             │${c.reset}`)
  console.log(`  ${c.dim}│  └───────────────────────────────────────────────────────────────┘${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)

  // 6. Completion Box & Instructions
  console.log(`  ${c.cyan}◇ What to do next ─────────────────────────────────────────────────┐${c.reset}`)
  if (hasBinary) {
    console.log(`  ${c.dim}│${c.reset} 1. Start OpenCode in your project terminal.                      ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset} 2. When the agent is thinking, your news ticker will appear.     ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset} 3. Type ${c.bold}/news${c.reset} anytime to open the fullscreen reader.             ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset} 4. Start typing your message anytime — the ticker vanishes!      ${c.dim}│${c.reset}`)
  } else {
    console.log(`  ${c.dim}│${c.reset} 1. Install OpenCode: ${c.bold}npm i -g opencode${c.reset} (https://opencode.ai)     ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset} 2. Open your project terminal and run OpenCode.                  ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset} 3. While the agent works, your news ticker will appear!          ${c.dim}│${c.reset}`)
    console.log(`  ${c.dim}│${c.reset} 4. Type ${c.bold}/news${c.reset} anytime to open the fullscreen reader.             ${c.dim}│${c.reset}`)
  }
  console.log(`  ${c.cyan}└──────────────────────────────────────────────────────────────────┘${c.reset}`)
  console.log()
  console.log(`  ${c.green}✓ WaitFeed setup complete! Happy coding.${c.reset}`)
  console.log()
}

function printHelp() {
  console.log(`
  ${c.bold}WaitFeed${c.reset} - OpenCode agent wait time news ticker

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
      console.log("waitfeed v1.0.3")
    }
    return
  }

  // Default behavior or "init": run the onboarding flow
  await runInit()
}

main().catch((err) => {
  console.error(`\n  ${c.orange}Error during WaitFeed setup:${c.reset}`, err.message)
  process.exit(1)
})
