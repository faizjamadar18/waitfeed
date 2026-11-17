#!/usr/bin/env node

/**
 * WaitFeed CLI — onboarding wizard + removal (npx waitfeed init | remove)
 *
 * 100% local, zero-backend, keyless setup for AI coding agents.
 * Supports OpenCode, Google Antigravity (AGY), and Claude Code (extensible provider architecture).
 */

import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
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

// --- Width-aware wrapping (SGR escapes are zero-width) ---
// The next-steps box draws a border on both sides, so every row must measure
// the same on screen. Wrap the visible characters, then re-apply whatever SGR
// style was active at each character so a wrapped row keeps its colors.
const SGR_AT_START = /^\x1B\[[0-9;]*m/

function splitStyledChars(text) {
  const chars = []
  let active = ""
  let i = 0
  while (i < text.length) {
    const sgr = text[i] === "\x1B" ? SGR_AT_START.exec(text.slice(i)) : null
    if (sgr) {
      active = sgr[0] === "\x1B[0m" ? "" : active + sgr[0]
      i += sgr[0].length
      continue
    }
    chars.push({ ch: text[i], style: active })
    i++
  }
  return chars
}

function renderStyledChars(chars) {
  let out = ""
  let style = ""
  for (const char of chars) {
    if (char.style !== style) {
      out += `\x1B[0m${char.style}`
      style = char.style
    }
    out += char.ch
  }
  return style ? out + "\x1B[0m" : out
}

function wrapStyled(text, width) {
  const limit = Math.max(1, width)
  const words = []
  let word = []
  for (const char of splitStyledChars(text)) {
    if (char.ch === " ") {
      if (word.length) {
        words.push(word)
        word = []
      }
    } else {
      word.push(char)
    }
  }
  if (word.length) words.push(word)

  const lines = []
  let line = []
  let used = 0
  const flush = () => {
    lines.push(line)
    line = []
    used = 0
  }
  for (const current of words) {
    if (line.length && used + 1 + current.length > limit) flush()
    // A single token longer than the row (a URL, a path) hard-splits too.
    while (current.length > limit - used) {
      line.push(...current.splice(0, limit - used))
      flush()
    }
    if (line.length) {
      line.push({ ch: " ", style: "" })
      used++
    }
    line.push(...current)
    used += current.length
  }
  if (line.length) lines.push(line)
  return lines.map(renderStyledChars)
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

// --- Claude Code keybindings (ctrl+n → the card's own toggle) ---
// Claude Code reads ~/.claude/keybindings.json (docs: code.claude.com/docs/en/
// keybindings). We add ONE Chat binding — ctrl+n → command:waitfeed, the mod's
// own "/waitfeed" command — and merge around whatever is already there. The
// mod owns the flip and redraws, so the same key always reverses the card.
// (The host's band collapse, ctrl+x ctrl+a, cannot be read or undone by a mod,
// which is why the card no longer rides it.) The key is instant and writes no
// file. A key the user already bound to something else is never clobbered; we
// just leave it and report the conflict.
const CLAUDE_KEYBINDINGS_SCHEMA = "https://www.schemastore.org/claude-code-keybindings.json"
const CLAUDE_TOGGLE_KEY = "ctrl+n"
const CLAUDE_TOGGLE_ACTION = "command:waitfeed"
// Actions an older WaitFeed wrote here; removal still recognises them so a
// legacy install cleans up after itself.
const CLAUDE_LEGACY_TOGGLE_ACTIONS = ["abovePrompt:toggle", "command:news"]

/** True for the action we write now, or one a legacy install left behind. */
const isOurToggleAction = (action) =>
  action === CLAUDE_TOGGLE_ACTION || CLAUDE_LEGACY_TOGGLE_ACTIONS.includes(action)


async function registerClaudeKeybindings(home) {
  const path = join(home, ".claude", "keybindings.json")
  let doc = null
  if (existsSync(path)) {
    try {
      const clean = stripJsoncComments(await readFile(path, "utf8"))
      const parsed = clean ? JSON.parse(clean) : null
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) doc = parsed
      else return { path, configured: false, unreadable: true }
    } catch {
      return { path, configured: false, unreadable: true }
    }
  }
  if (!doc) doc = { $schema: CLAUDE_KEYBINDINGS_SCHEMA, bindings: [] }
  if (!Array.isArray(doc.bindings)) doc.bindings = []

  let chat = doc.bindings.find(
    (block) => block && block.context === "Chat" && block.bindings && typeof block.bindings === "object",
  )
  if (!chat) {
    chat = { context: "Chat", bindings: {} }
    doc.bindings.push(chat)
  }

  const existing = chat.bindings[CLAUDE_TOGGLE_KEY]
  if (existing !== undefined && !isOurToggleAction(existing)) {
    // Someone else owns ctrl+n — never take it away from them.
    return { path, configured: false, conflict: true }
  }
  if (existing === CLAUDE_TOGGLE_ACTION) return { path, configured: true, alreadyConfigured: true }

  chat.bindings[CLAUDE_TOGGLE_KEY] = CLAUDE_TOGGLE_ACTION
  if (!doc.$schema) doc.$schema = CLAUDE_KEYBINDINGS_SCHEMA
  await mkdir(join(home, ".claude"), { recursive: true })
  await writeFile(path, JSON.stringify(doc, null, 2) + "\n", "utf8")
  return { path, configured: true, alreadyConfigured: false }
}

async function removeClaudeKeybindings(home) {
  const path = join(home, ".claude", "keybindings.json")
  const doc = await readJsonConfig(path)
  if (doc === null) return { configured: false, path }
  if (doc === undefined) return { configured: false, unreadable: true, path }
  if (!Array.isArray(doc.bindings)) return { configured: false, path }

  let touched = false
  for (const block of doc.bindings) {
    if (!block || typeof block !== "object" || !block.bindings || typeof block.bindings !== "object") continue
    if (isOurToggleAction(block.bindings[CLAUDE_TOGGLE_KEY])) {
      delete block.bindings[CLAUDE_TOGGLE_KEY]
      touched = true
    }
  }
  if (!touched) return { configured: false, path }

  // Drop any Chat block OUR removal emptied; keep everything else.
  doc.bindings = doc.bindings.filter(
    (block) =>
      !(
        block &&
        block.context === "Chat" &&
        block.bindings &&
        typeof block.bindings === "object" &&
        Object.keys(block.bindings).length === 0
      ),
  )
  if (doc.bindings.length === 0) delete doc.bindings
  const meaningful = Object.keys(doc).filter((k) => k !== "$schema")
  if (meaningful.length === 0) {
    await rm(path, { force: true })
    return { configured: true, path }
  }
  await writeJsonConfig(path, doc)
  return { configured: true, path }
}

// --- Claude Code Config Utilities ---
async function registerClaudePlugin(customHome) {
  const home = customHome || homedir()
  const pluginDir = join(home, ".claude", "waitfeed")
  const distDir = join(pluginDir, "dist")
  const settingsPath = join(home, ".claude", "settings.json")

  await mkdir(distDir, { recursive: true })

  // 1. Stage shipped plugin assets into ~/.claude/waitfeed. The card lives in
  // the mod's band now, so the only runner is the data-cycle scheduler.
  const sourceClaudeDir = fileURLToPath(new URL("./claude", import.meta.url))
  const filesToStage = [
    { src: join(sourceClaudeDir, "dist", "scheduler.mjs"), dest: join(distDir, "scheduler.mjs") },
  ]

  let stagedCount = 0
  for (const { src, dest } of filesToStage) {
    if (existsSync(src)) {
      await copyFile(src, dest)
      stagedCount++
    }
  }

  // 1b. Stage the /feed pane — a Claude "mod" (a plugin whose hooks module
  // draws in the interface). Claude Code loads it from the path the docs
  // list in CLAUDE_CODE_PLUGIN_DIRS ("Environment, or env in
  // ~/.claude/settings.json"; `;`-separated on Windows).
  const modSourceDir = fileURLToPath(new URL("./claude-mod", import.meta.url))
  const modDestDir = join(pluginDir, "claude-mod")
  const modFiles = [
    [".claude-plugin", "plugin.json"],
    ["hooks", "hooks.json"],
    ["hooks", "register.js"],
    ["README.md"],
  ]
  for (const rel of modFiles) {
    const src = join(modSourceDir, ...rel)
    if (existsSync(src)) {
      await mkdir(join(modDestDir, ...rel.slice(0, -1)), { recursive: true })
      await copyFile(src, join(modDestDir, ...rel))
      stagedCount++
    }
  }

  // 2. Configure the SessionStart data cycle in ~/.claude/settings.json.
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

  const targetSchedulerPath = join(distDir, "scheduler.mjs").replace(/\\/g, "/")
  const cycleCommand = `node ${targetSchedulerPath} --cycle`

  // The card used to live in the status line, backed by a per-session activity
  // ledger, an instant-paint flip and an Esc-interrupt watcher — all of that
  // is gone now (the band reads the host's own `isWorking`). A stale entry
  // would run a bundle that no longer ships, so init prunes our own leftovers
  // first: the statusLine whose command points into the staged dir, and every
  // hook group of ours that is not the data cycle. Foreign status lines and
  // hooks are matched by the staged dir and always survive untouched.
  const stageMarker = pluginDir.replace(/\\/g, "/")
  let changed = false
  if (settings.statusLine && typeof settings.statusLine === "object") {
    const command = typeof settings.statusLine.command === "string" ? settings.statusLine.command : ""
    if (command.includes(stageMarker)) {
      delete settings.statusLine
      changed = true
    }
  }

  if (!settings.hooks || typeof settings.hooks !== "object") settings.hooks = {}
  for (const event of Object.keys(settings.hooks)) {
    const entries = settings.hooks[event]
    if (!Array.isArray(entries)) continue
    const cleaned = []
    for (const entry of entries) {
      if (!entry || !Array.isArray(entry.hooks)) {
        cleaned.push(entry)
        continue
      }
      const kept = entry.hooks.filter(
        (h) => !(h && typeof h.command === "string" && h.command.includes(stageMarker) && h.command !== cycleCommand),
      )
      if (kept.length === entry.hooks.length) cleaned.push(entry)
      else {
        changed = true
        if (kept.length > 0) cleaned.push({ ...entry, hooks: kept })
      }
    }
    if (cleaned.length > 0) settings.hooks[event] = cleaned
    else delete settings.hooks[event]
  }

  // One matcher group per WaitFeed hook handler, added only when absent so
  // re-running init never duplicates entries.
  const addHook = (event, command, opts = {}) => {
    if (!Array.isArray(settings.hooks[event])) settings.hooks[event] = []
    const matcher = opts.matcher
    const present = settings.hooks[event].some(
      (entry) =>
        (matcher === undefined || entry?.matcher === matcher) &&
        Array.isArray(entry?.hooks) &&
        entry.hooks.some((h) => h && h.command === command)
    )
    if (present) return
    settings.hooks[event].push({
      ...(matcher !== undefined ? { matcher } : {}),
      hooks: [{ type: "command", command, ...(opts.async ? { async: true } : {}) }],
    })
  }

  // The ONLY WaitFeed hook: fetch → enrich → cache (headline mode) when a
  // session starts. The card's busy/idle gating is the host's now — the band
  // renders only while a model turn runs — so there is no ledger to write and
  // nothing to watch.
  const hadCycle =
    Array.isArray(settings.hooks.SessionStart) &&
    settings.hooks.SessionStart.some(
      (entry) => Array.isArray(entry?.hooks) && entry.hooks.some((h) => h && h.command === cycleCommand),
    )
  addHook("SessionStart", cycleCommand)

  const alreadyConfigured = !changed && hadCycle
  // The env entry persists the pane across launches that cannot take a
  // --plugin-dir flag. Split and join on the SAME per-platform separator the
  // docs name, so a drive-letter colon ("C:/their/tools") survives intact.
  const dirSep = process.platform === "win32" ? ";" : ":"
  const ourModPath = modDestDir.replace(/\\/g, "/")
  const existingDirs =
    settings.env && typeof settings.env === "object" && typeof settings.env.CLAUDE_CODE_PLUGIN_DIRS === "string"
      ? settings.env.CLAUDE_CODE_PLUGIN_DIRS
      : ""
  const keptDirs = existingDirs
    .split(dirSep)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p.replace(/\\/g, "/") !== ourModPath)
  keptDirs.push(ourModPath)
  if (keptDirs.join(dirSep) !== existingDirs) {
    settings.env = {
      ...(settings.env && typeof settings.env === "object" ? settings.env : {}),
      CLAUDE_CODE_PLUGIN_DIRS: keptDirs.join(dirSep),
    }
  }

  await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8")

  // Bind ctrl+n to the mod's own /waitfeed toggle — the instant, file-free
  // show/hide for the card. A key the user bound to something else is left
  // alone (the host default ctrl+x ctrl+a still collapses the band either way).
  try {
    await registerClaudeKeybindings(home)
  } catch {
    // best-effort
  }

  return {
    pluginDir,
    settingsPath,
    stagedCount,
    alreadyConfigured,
    settingsExisted,
  }
}

// --- Removal (the exact reverse of the register helpers above) ---
// Removal is held to a stricter standard than registration: it never
// rewrites — let alone deletes — a config file it could not fully parse,
// and it removes ONLY entries it can positively identify as WaitFeed's.
// A foreign statusLine, plugin, or hook group always survives untouched.

// Returns the parsed config object, null when the file does not exist, or
// undefined when it exists but cannot be understood (malformed JSON).
async function readJsonConfig(configPath) {
  if (!existsSync(configPath)) return null
  try {
    const clean = stripJsoncComments(await readFile(configPath, "utf8"))
    const parsed = JSON.parse(clean)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

// Writes a cleaned config back; deletes the file outright when nothing is
// left in it — "removed" should not leave empty JSON husks behind.
async function writeJsonConfig(configPath, parsed) {
  if (Object.keys(parsed).length === 0) {
    await rm(configPath, { force: true })
    return
  }
  await writeFile(configPath, JSON.stringify(parsed, null, 2) + "\n", "utf8")
}

async function removeOpenCodePlugin(customDir) {
  const opencodeDir = customDir || join(homedir(), ".config", "opencode")
  const configPath = resolveOpenCodeConfigPath(opencodeDir)
  const parsed = await readJsonConfig(configPath)
  if (parsed === null) return { configured: false, path: configPath }
  if (parsed === undefined) return { configured: false, unreadable: true, path: configPath }

  const plugins = Array.isArray(parsed.plugins) ? parsed.plugins : []
  if (!plugins.includes("waitfeed")) return { configured: false, path: configPath }

  const remaining = plugins.filter((p) => p !== "waitfeed")
  if (remaining.length > 0) parsed.plugins = remaining
  else delete parsed.plugins
  await writeJsonConfig(configPath, parsed)
  return { configured: true, path: configPath }
}

async function removeAgyPlugin(customHome) {
  const home = customHome || homedir()
  const pluginDir = join(home, ".gemini", "config", "plugins", "waitfeed")
  const settingsPath = join(home, ".gemini", "antigravity-cli", "settings.json")
  const marker = pluginDir.replace(/\\/g, "/")

  const settings = await readJsonConfig(settingsPath)
  if (settings === null) return { configured: false, path: settingsPath }
  if (settings === undefined) return { configured: false, unreadable: true, path: settingsPath }

  const command =
    settings.statusLine && typeof settings.statusLine === "object" && typeof settings.statusLine.command === "string"
      ? settings.statusLine.command
      : ""
  if (!command.includes(marker)) return { configured: false, path: settingsPath }

  delete settings.statusLine
  await writeJsonConfig(settingsPath, settings)
  await rm(pluginDir, { recursive: true, force: true })
  return { configured: true, path: settingsPath }
}

async function removeClaudePlugin(customHome) {
  const home = customHome || homedir()
  const pluginDir = join(home, ".claude", "waitfeed")
  const settingsPath = join(home, ".claude", "settings.json")
  const marker = pluginDir.replace(/\\/g, "/")

  const settings = await readJsonConfig(settingsPath)
  if (settings === undefined) return { configured: false, unreadable: true, path: settingsPath }

  let touched = false

  if (settings) {
    // statusLine: a legacy WaitFeed install (the card used to live there).
    // Remove it only when the command points into the staged waitfeed dir; the
    // old instant-paint flip appended " --wf" at runtime, same marker either way.
    if (settings.statusLine && typeof settings.statusLine === "object") {
      const command = typeof settings.statusLine.command === "string" ? settings.statusLine.command : ""
      if (command.includes(marker)) {
        delete settings.statusLine
        touched = true
      }
    }

    // env: take our CLAUDE_CODE_PLUGIN_DIRS entry back out. Same platform
    // separator; foreign plugin dirs and other env keys survive untouched.
    if (settings.env && typeof settings.env === "object" && typeof settings.env.CLAUDE_CODE_PLUGIN_DIRS === "string") {
      const dirSep = process.platform === "win32" ? ";" : ":"
      const below = join(pluginDir, "claude-mod").replace(/\\/g, "/")
      const entries = settings.env.CLAUDE_CODE_PLUGIN_DIRS.split(dirSep)
        .map((p) => p.trim())
        .filter(Boolean)
      const kept = entries.filter((p) => p.replace(/\\/g, "/") !== below)
      if (kept.length !== entries.length) {
        touched = true
        if (kept.length === 0) delete settings.env.CLAUDE_CODE_PLUGIN_DIRS
        else settings.env.CLAUDE_CODE_PLUGIN_DIRS = kept.join(dirSep)
        if (Object.keys(settings.env).length === 0) delete settings.env
      }
    }

    // hooks: strip every hook whose command calls the waitfeed scheduler.
    // Entries that lose all their hooks disappear, events that lose all their
    // entries disappear, and anything else in settings.hooks survives.
    if (settings.hooks && typeof settings.hooks === "object") {
      for (const event of Object.keys(settings.hooks)) {
        const entries = settings.hooks[event]
        if (!Array.isArray(entries)) continue
        const cleaned = []
        for (const entry of entries) {
          if (!entry || !Array.isArray(entry.hooks)) {
            cleaned.push(entry)
            continue
          }
          const kept = entry.hooks.filter((h) => !(h && typeof h.command === "string" && h.command.includes(marker)))
          if (kept.length === 0) touched = true
          else if (kept.length < entry.hooks.length) {
            touched = true
            cleaned.push({ ...entry, hooks: kept })
          } else cleaned.push(entry)
        }
        if (cleaned.length > 0) settings.hooks[event] = cleaned
        else if (entries.length > 0) delete settings.hooks[event]
      }
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks
    }
  }

  // keybindings: take our ctrl+n → /waitfeed entry back out; nothing else.
  const keybindings = await removeClaudeKeybindings(home)
  if (keybindings.configured) touched = true

  if (!touched) return { configured: false, path: settingsPath }

  if (settings) await writeJsonConfig(settingsPath, settings)
  await rm(pluginDir, { recursive: true, force: true })
  return { configured: true, path: settingsPath }
}

// The shared data dir — config.json, the news cache, the cycle lock.
async function removeWaitFeedData(customDir) {
  const dir = customDir || join(homedir(), ".config", "waitfeed")
  if (!existsSync(dir)) return { removed: false, dir }
  await rm(dir, { recursive: true, force: true })
  return { removed: true, dir }
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
    newsMode: "auto",
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8")
  return configPath
}

// --- Shared show/hide switch (npx waitfeed show | hide | toggle) ---
// Show/hide switch (~/.config/waitfeed/config.json). Supports setting mode globally
// or for an independent host (opencode, claude, agy).
async function setNewsMode(mode, customDir, host) {
  const dir = customDir || join(homedir(), ".config", "waitfeed")
  const configPath = join(dir, "config.json")
  let config = {}
  if (existsSync(configPath)) {
    try {
      const clean = stripJsoncComments(await readFile(configPath, "utf8"))
      const parsed = clean ? JSON.parse(clean) : null
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) config = parsed
    } catch {
      config = {}
    }
  }
  if (!config.newsModes || typeof config.newsModes !== "object") {
    config.newsModes = {}
  }
  if (host && ["opencode", "claude", "agy"].includes(host)) {
    config.newsModes[host] = mode
  } else {
    config.newsMode = mode
    config.newsModes.opencode = mode
    config.newsModes.claude = mode
    config.newsModes.agy = mode
  }
  await mkdir(dir, { recursive: true })
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8")
  return { configPath, mode, host }
}

async function toggleNewsMode(customDir, host) {
  const dir = customDir || join(homedir(), ".config", "waitfeed")
  const configPath = join(dir, "config.json")
  let current = "auto"
  if (existsSync(configPath)) {
    try {
      const clean = stripJsoncComments(await readFile(configPath, "utf8"))
      const parsed = clean ? JSON.parse(clean) : null
      if (host && parsed?.newsModes?.[host]) {
        current = parsed.newsModes[host]
      } else if (parsed && typeof parsed === "object") {
        current = parsed.newsMode || "auto"
      }
    } catch {
      current = "auto"
    }
  }
  // Flip what the host shows: the card-while-working (auto) → hide, and
  // hide → auto. Never "show": nothing may pin the card at idle.
  const next = current === "hide" ? "auto" : "hide"
  return setNewsMode(next, dir, host)
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

// --- 3D ASCII Startup Banner ---
const BANNER_LINES = [
  "██╗    ██╗ █████╗ ██╗████████╗███████╗███████╗███████╗██████╗ ",
  "██║    ██║██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝██╔════╝██╔══██╗",
  "██║ █╗ ██║███████║██║   ██║   █████╗  █████╗  █████╗  ██║  ██║",
  "██║███╗██║██╔══██║██║   ██║   ██╔══╝  ██╔══╝  ██╔══╝  ██║  ██║",
  "╚███╔███╔╝██║  ██║██║   ██║   ██║     ███████╗███████╗██████╔╝",
  " ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝     ╚══════╝╚══════╝╚═════╝ ",
]

// Banner color mapping (orange gradient + outline -> neutral greys)
// Letters (5 horizontal bands, top to bottom):
//   #FFD9A0 -> #919191 (145, 145, 145)
//   #FFB96C -> #7B7B7B (123, 123, 123)
//   #FF9A39 -> #656565 (101, 101, 101)
//   #F37E1B -> #4F4F4F (79, 79, 79)
//   #DC6712 -> #3A3A3A (58, 58, 58)
// Outline / shadow:
//   #665740 -> #595959 (89, 89, 89)   [neutral grey matching original outline brightness]
//   #664A2B -> #6A6A6A (106, 106, 106)
//   #663E17 -> #4B4B4B (75, 75, 75)
//   #61320B -> #383838 (56, 56, 56)
//   #582907 -> #333333 (51, 51, 51)
//   #4E2004 -> #2E2E2E (46, 46, 46)
const BANNER_ROW_COLORS = [
  { front: { r: 145, g: 145, b: 145 }, shadow: { r: 89, g: 89, b: 89 } },
  { front: { r: 123, g: 123, b: 123 }, shadow: { r: 106, g: 106, b: 106 } },
  { front: { r: 101, g: 101, b: 101 }, shadow: { r: 75, g: 75, b: 75 } },
  { front: { r: 79, g: 79, b: 79 }, shadow: { r: 56, g: 56, b: 56 } },
  { front: { r: 58, g: 58, b: 58 }, shadow: { r: 51, g: 51, b: 51 } },
  { front: { r: 58, g: 58, b: 58 }, shadow: { r: 46, g: 46, b: 46 } },
]

// 256-color fallback codes (nearest greys from xterm 256 grayscale ramp 232-255)
const BANNER_256_COLORS = [
  { front: 246, shadow: 240 },
  { front: 243, shadow: 242 },
  { front: 241, shadow: 239 },
  { front: 239, shadow: 237 },
  { front: 237, shadow: 236 },
  { front: 237, shadow: 236 },
]

function getRowColor(rowIndex) {
  const i = Math.max(0, Math.min(BANNER_ROW_COLORS.length - 1, rowIndex))
  return BANNER_ROW_COLORS[i].front
}

function getShadowColor(rowIndex) {
  const i = Math.max(0, Math.min(BANNER_ROW_COLORS.length - 1, rowIndex))
  return BANNER_ROW_COLORS[i].shadow
}

function colorLine(line, frontEscape, shadowEscape) {
  let result = ""
  let currentColor = null
  for (const char of line) {
    if (char === " ") {
      if (currentColor !== null) {
        result += "\x1b[0m"
        currentColor = null
      }
      result += " "
    } else if (char === "█") {
      if (currentColor !== "front") {
        if (currentColor !== null) result += "\x1b[0m"
        result += frontEscape
        currentColor = "front"
      }
      result += char
    } else {
      if (currentColor !== "shadow") {
        if (currentColor !== null) result += "\x1b[0m"
        result += shadowEscape
        currentColor = "shadow"
      }
      result += char
    }
  }
  if (currentColor !== null) {
    result += "\x1b[0m"
  }
  return result
}

function colorLine24(line, frontColor, shadowColor) {
  return colorLine(
    line,
    `\x1b[38;2;${frontColor.r};${frontColor.g};${frontColor.b}m`,
    `\x1b[38;2;${shadowColor.r};${shadowColor.g};${shadowColor.b}m`
  )
}

function colorLine256(line, frontCode, shadowCode) {
  return colorLine(line, `\x1b[38;5;${frontCode}m`, `\x1b[38;5;${shadowCode}m`)
}

function getPackageVersion() {
  try {
    const pkgPath = new URL("./package.json", import.meta.url)
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
    return pkg.version || "1.0.0"
  } catch {
    return "1.0.0"
  }
}

function renderBanner(options = {}) {
  const env = options.env || process.env
  const isTTY = options.isTTY !== undefined ? Boolean(options.isTTY) : Boolean(process.stdout.isTTY)
  const columns = options.columns !== undefined ? options.columns : process.stdout.columns
  const version = options.version || getPackageVersion()

  const isNarrow = typeof columns === "number" && columns > 0 && columns < 66
  const noColor = env.NO_COLOR !== undefined || !isTTY || env.TERM === "dumb"
  const colorTerm = (env.COLORTERM || "").toLowerCase()
  const supports24Bit = colorTerm === "truecolor" || colorTerm === "24bit" || Boolean(env.WT_SESSION)

  if (isNarrow) {
    if (noColor) {
      return `WAITFEED  ·  v${version}`
    }
    if (!supports24Bit) {
      return `\x1b[38;5;241mWAITFEED\x1b[0m  ·  v${version}`
    }
    return `\x1b[38;2;101;101;101mWAITFEED\x1b[0m  ·  v${version}`
  }

  if (noColor) {
    const lines = [...BANNER_LINES, `News on your screen while your AI agent works · v${version}`]
    return lines.join("\n")
  }

  if (!supports24Bit) {
    const lines = BANNER_LINES.map((line, i) => {
      const { front, shadow } = BANNER_256_COLORS[i]
      return colorLine256(line, front, shadow)
    })
    lines.push(`\x1b[90mNews on your screen while your AI agent works · v${version}\x1b[0m`)
    return lines.join("\n")
  }

  const lines = BANNER_LINES.map((line, i) => {
    const front = getRowColor(i)
    const shadow = getShadowColor(i)
    return colorLine24(line, front, shadow)
  })
  lines.push(`\x1b[38;2;139;137;129mNews on your screen while your AI agent works · v${version}\x1b[0m`)
  return lines.join("\n")
}

// --- Next steps box ---
// One inner width drives every line: labels form a two-column table (the
// fastest way to scan "what do I type?") and copy wraps instead of spilling
// past the right border. ASCII and `·` only inside the box — `—` is
// ambiguous-width on CJK terminals and would shift the edge.
function renderNextSteps(selected = {}, { columns = process.stdout.columns || 80 } = {}) {
  // 64 keeps the longest row (AGY + the global switch) two columns clear of
  // the right border; `columns - 6` keeps the whole box clear of the edge.
  const inner = Math.max(24, Math.min(64, columns - 6))
  const width = inner + 2 // "│" + inner + "│"
  const labelWidth = 11 // "Claude Code" / "Antigravity"
  const gutter = labelWidth + 3 // leading space + two-column gap
  const lines = []

  const title = "◇ Next steps "
  lines.push(`  ${c.cyan}${title}${"─".repeat(width - 1 - title.length)}┐${c.reset}`)

  const cmd = (s) => `${c.white}${s}${c.reset}`
  const dot = `${c.dim} · ${c.reset}`
  const row = (label, text) => {
    const head = ` ${c.bold}${label}${c.reset}${" ".repeat(Math.max(0, labelWidth - label.length) + 2)}`
    const hang = " ".repeat(gutter)
    wrapStyled(text, inner - gutter).forEach((part, index) => {
      const pad = " ".repeat(Math.max(0, inner - gutter - stripAnsi(part).length))
      lines.push(`  ${c.dim}│${c.reset}${index === 0 ? head : hang}${part}${pad}${c.dim}│${c.reset}`)
    })
  }

  if (selected.opencode) {
    row("OpenCode", `${cmd("opencode")}${dot}${cmd("/feed")}${c.dim} · Ctrl+O toggles card${c.reset}`)
  }
  if (selected.claude) {
    row("Claude Code", `${cmd("claude")}${dot}${cmd("/feed")}${c.dim} · Ctrl+N toggles card${c.reset}`)
  }
  if (selected.agy) {
    row(
      "Antigravity",
      `${cmd("agy")}${dot}${c.dim}statusline${c.reset}${dot}${cmd("npx waitfeed show/hide/toggle")}`,
    )
  }
  if (!selected.opencode && !selected.claude && !selected.agy) {
    row("Setup", `${cmd("npx waitfeed init")}${c.dim} · re-run this wizard${c.reset}`)
  } else if (!selected.agy) {
    // The AGY row carries the switch; keep it discoverable without AGY too.
    row("", cmd("npx waitfeed show/hide/toggle"))
  }

  lines.push(`  ${c.cyan}└${"─".repeat(width - 2)}┘${c.reset}`)
  return lines
}

// --- Main CLI Execution ---
async function runInit() {
  console.log()
  console.log(renderBanner())
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
    console.log(`  ${c.green}◆${c.reset} Claude Code: ${c.white}detected${c.reset}`)
  } else {
    console.log(`  ${c.dim}◇ Claude Code: not detected${c.reset}`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 2. Interactive Agent Provider Selection
  // If neither detected, enable OpenCode, AGY, and Claude by default for user discovery.
  const hasAnyDetected = opencodeStatus.installed || agyStatus.installed || claudeStatus.installed
  const defaultOpenCode = hasAnyDetected ? opencodeStatus.installed : true
  const defaultAgy = hasAnyDetected ? agyStatus.installed : true
  const defaultClaude = hasAnyDetected ? claudeStatus.installed : true

  const agentItems = [
    {
      key: "opencode",
      name: "OpenCode",
      desc: "Prompt-line card & /feed reader",
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
      desc: "Above-prompt card + /feed pane",
      enabled: defaultClaude,
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
  const configPath = await saveWaitFeedUserConfig(sources, rssUrls)
  console.log(`  ${c.green}✓${c.reset} Preferences saved ${c.dim}·${c.reset} ${c.white}${configPath}${c.reset}`)

  if (selectedAgents.opencode) {
    await registerOpenCodePlugin()
    console.log(`  ${c.green}✓${c.reset} OpenCode integration active`)
  }

  if (selectedAgents.agy) {
    await registerAgyPlugin()
    console.log(`  ${c.green}✓${c.reset} Google Antigravity (AGY) integration active`)
  }

  if (selectedAgents.claude) {
    await registerClaudePlugin()
    console.log(`  ${c.green}✓${c.reset} Claude Code integration active`)
  }
  console.log(`  ${c.dim}│${c.reset}`)

  // 6. Single Unified Live Card Preview
  console.log(`  ${c.cyan}◇${c.reset} ${c.bold}Live preview (while your agent works):${c.reset}`)
  console.log(`  ${c.dim}│${c.reset}`)
  console.log(`  ${c.dim}│  ┌───────────────────────────────────────────────────────────────┐${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset} ${c.orange}${c.bold}▍ [HN]${c.reset}  ${c.bold}${c.white}SWE-bench: Evaluating AI coding agents${c.reset}    ${c.orange}▲ 1.2k${c.reset}${c.dim} · 2h${c.reset} ${c.dim}│${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}Autonomous agents resolve real GitHub bugs and pass        │${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}full test suites without human intervention.               │${c.reset}`)
  console.log(`  ${c.dim}│  │${c.reset}    ${c.dim}> ${c.cyan}swebench.com${c.reset}${c.dim}                                             │${c.reset}`)
  console.log(`  ${c.dim}│  └───────────────────────────────────────────────────────────────┘${c.reset}`)
  console.log(`  ${c.dim}│  ▸ Above the prompt in OpenCode / Claude Code · AGY statusline${c.reset}`)

  // 7. Next steps: one scannable row per configured host, borders aligned.
  console.log()
  for (const line of renderNextSteps(selectedAgents)) console.log(line)
  console.log()
  console.log(`  ${c.green}✓ WaitFeed setup complete! Happy coding.${c.reset}`)
  console.log()
  if (process.stdin.isTTY) {
    process.stdin.pause()
  }
}

// --- Removal flow (user-facing mirror of runInit) ---
async function runRemove({ keepData = false } = {}) {
  console.log()
  console.log(`  ${c.bold}Removing WaitFeed from this machine...${c.reset}`)
  console.log()

  const hostResult = (label, res) => {
    if (res.configured) {
      console.log(`  ${c.green}✓${c.reset} ${label}: ${c.white}integration removed${c.reset}`)
    } else if (res.unreadable) {
      console.log(`  ${c.yellow}◆${c.reset} ${label}: could not read ${res.path} - left untouched`)
    } else {
      console.log(`  ${c.dim}◇ ${label}: not configured${c.reset}`)
    }
  }

  hostResult("OpenCode", await removeOpenCodePlugin())
  hostResult("Google Antigravity (AGY)", await removeAgyPlugin())
  hostResult("Claude Code", await removeClaudePlugin())

  const dataRes = await removeWaitFeedData()
  if (keepData) {
    console.log(`  ${c.dim}◇ Data kept (--keep-data): ${dataRes.dir}${c.reset}`)
  } else if (dataRes.removed) {
    console.log(`  ${c.green}✓${c.reset} Removed ${c.white}${dataRes.dir}${c.reset}`)
  } else {
    console.log(`  ${c.dim}◇ No data folder at ${dataRes.dir}${c.reset}`)
  }

  console.log()
  console.log(
    `  ${c.green}✓${c.reset} ${c.bold}WaitFeed fully removed.${c.reset} Run ${c.bold}npx waitfeed init${c.reset} to set it up again.`
  )
  console.log()
}

function printHelp() {
  console.log(`
  ${c.bold}WaitFeed${c.reset} - Make Every Agent Wait Count

  ${c.bold}Usage:${c.reset}
    npx waitfeed init      Run the interactive setup wizard
    npx waitfeed remove    Remove WaitFeed from every agent and delete its data
    npx waitfeed show      Resume the news card (it shows while the agent works)
    npx waitfeed hide      Hide the news card (even while the agent works)
    npx waitfeed toggle    Flip the news card on / off (while the agent works)
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
      console.log("waitfeed v1.3.0")
    }
    return
  }

  if (arg === "remove" || arg === "uninstall") {
    const keepData = process.argv.slice(3).includes("--keep-data")
    await runRemove({ keepData })
    return
  }

  // Show/hide switch, usable from any shell:
  // npx waitfeed hide [host] | show [host] | auto [host] | toggle [host]
  if (arg === "show" || arg === "hide" || arg === "auto" || arg === "toggle") {
    const targetHost = (process.argv[3] || "").toLowerCase()
    const validHost = ["opencode", "claude", "agy"].includes(targetHost) ? targetHost : undefined
    const res = arg === "toggle" ? await toggleNewsMode(undefined, validHost) : await setNewsMode(arg, undefined, validHost)
    const hostLabel = res.host ? ` (${res.host})` : ""
    console.log(`WaitFeed news card${hostLabel}: ${res.mode}`)
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
  registerClaudePlugin,
  registerClaudeKeybindings,
  removeOpenCodePlugin,
  removeAgyPlugin,
  removeClaudePlugin,
  removeClaudeKeybindings,
  removeWaitFeedData,
  saveWaitFeedUserConfig,
  setNewsMode,
  toggleNewsMode,
  resolveOpenCodeConfigPath,
  stripJsoncComments,
  countLinesRows,
  eraseBlock,
  renderBanner,
  renderNextSteps,
}

// If invoked as CLI entry
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`\n  ${c.orange}Error during WaitFeed setup:${c.reset}`, err.message)
    process.exit(1)
  })
}
