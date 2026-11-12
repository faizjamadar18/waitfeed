// WaitFeed user config — ~/.config/waitfeed/config.json.
//
// There is no separate installer step: the reader itself is the setup. The
// first /feed open materializes the file with defaults, keys 1-4 toggle the
// channels and persist instantly. Unknown or half-written files always fall
// back to defaults — a hand-edited config can never break the ticker.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export const CHANNEL_KEYS = ["hn", "devto", "github", "reddit"] as const
export type ChannelKey = (typeof CHANNEL_KEYS)[number]

/** The badge each channel renders as on ticker cards and reader rows. */
export const CHANNEL_BADGES: Record<ChannelKey, string> = {
  hn: "HN",
  devto: "DEV",
  github: "GH",
  reddit: "REDDIT",
}

/** Full channel names for the reader UI. */
export const CHANNEL_NAMES: Record<ChannelKey, string> = {
  hn: "Hacker News",
  devto: "Dev.to",
  github: "GitHub Trending",
  reddit: "Reddit",
}

/** Legacy/alternate source strings that belong to a channel: the Reddit
 * Atom channel stores items with source "R/PROG" while its badge is
 * "REDDIT" — the reader and the statusline filters must treat them as the
 * same switch. */
const SOURCE_ALIASES: Partial<Record<string, ChannelKey>> = {
  "R/PROG": "reddit",
  REDDIT: "reddit",
}

/** Which channel a cached item's stored source belongs to (or undefined
 * for the always-on "RSS" pseudo-channel and anything unknown). */
export function channelForSource(source: string): ChannelKey | undefined {
  for (const key of CHANNEL_KEYS) {
    if (CHANNEL_BADGES[key] === source) return key
  }
  return SOURCE_ALIASES[source]
}

/** Show / hide / auto — the user's manual control over the card:
 * - auto: card is visible only while the agent executes (quiet when idle).
 * - hide: card is forced off (dismissed even mid-run).
 * - show: legacy alias of auto. It can NEVER pin the card at idle — it is
 *   kept only for the ephemeral per-turn override the OpenCode TUI writes
 *   and for older config files. Every host is quiet at idle, always.
 * Each host (OpenCode, Claude Code, AGY) can toggle its visibility independently. */
export type NewsMode = "auto" | "show" | "hide"
export const NEWS_MODES: readonly NewsMode[] = ["auto", "show", "hide"]

export type HostId = "opencode" | "claude" | "agy"
export const HOST_IDS: readonly HostId[] = ["opencode", "claude", "agy"]

export interface WaitFeedConfig {
  /** False until the user's first keypress inside /feed marks setup complete. */
  setupDone: boolean
  sources: Record<ChannelKey, boolean>
  /** Bring-your-own RSS/Atom channels (max 10) — badges as RSS. */
  rssUrls: string[]
  /** Card hold time in seconds while the agent runs — the ticker rotation
   * pace. Narrow knob (5-120s), default 20s: a full story card reads in
   * roughly 15-25s, so the dwell must cover the read, never cut it. */
  dwellSeconds: number
  /** Default/fallback newsMode if a host has no independent override set. */
  newsMode: NewsMode
  /** Independent per-host show/hide modes so each tool can be toggled without
   * affecting other agents on the machine. */
  newsModes?: Partial<Record<HostId, NewsMode>>
}

/** Resolves the effective NewsMode for a specific host (OpenCode, Claude, AGY).
 * Prioritizes the host's independent mode; falls back to the shared newsMode. */
export function getHostNewsMode(cfg: WaitFeedConfig | null | undefined, host: HostId): NewsMode {
  if (!cfg) return "auto"
  if (cfg.newsModes && typeof cfg.newsModes === "object") {
    const mode = cfg.newsModes[host]
    if (mode && (NEWS_MODES as readonly string[]).includes(mode)) return mode
  }
  return cfg.newsMode ?? "auto"
}

/** Returns a new config with an independent NewsMode set for a specific host. */
export function setHostNewsMode(cfg: WaitFeedConfig, host: HostId, mode: NewsMode): WaitFeedConfig {
  return {
    ...cfg,
    newsModes: {
      ...(cfg.newsModes ?? {}),
      [host]: mode,
    },
  }
}

/** The ONE visibility rule all three hosts apply: the card rides the agent's
 * state — busy while not waiting on the user — and only `hide` forces it off
 * mid-run. Nothing can pin it on at idle: `show` is a legacy alias of `auto`,
 * so the idle terminal is always the host's own. Pure, so config and every
 * adapter agree. */
export function newsVisible(mode: NewsMode, busy: boolean, waitingOnUser = false): boolean {
  if (mode === "hide") return false
  return busy && !waitingOnUser
}

/** The toggle: flip to the opposite of what the user is looking at now. A
 * visible card is dismissed; a hidden one comes back as auto — visible again
 * only while the agent works, never a pinned-at-idle show. */
export function nextNewsMode(currentlyVisible: boolean): NewsMode {
  return currentlyVisible ? "hide" : "auto"
}

/** The dwell knob's bounds — deliberately narrow so a typo can't freeze or
 * strobe the ticker. */
export const DWELL_MIN = 5
export const DWELL_MAX = 120
export const DWELL_DEFAULT = 20

export const DEFAULT_CONFIG: WaitFeedConfig = {
  setupDone: false,
  sources: { hn: true, devto: true, github: true, reddit: true },
  rssUrls: [],
  dwellSeconds: DWELL_DEFAULT,
  newsMode: "auto",
}

/** Pure validation — no I/O, fully testable. */
export function normalizeConfig(raw: unknown): WaitFeedConfig {
  const out: WaitFeedConfig = {
    ...DEFAULT_CONFIG,
    sources: { ...DEFAULT_CONFIG.sources },
    rssUrls: [...DEFAULT_CONFIG.rssUrls],
  }
  if (!raw || typeof raw !== "object") return out
  const obj = raw as Record<string, unknown>
  if (typeof obj.setupDone === "boolean") out.setupDone = obj.setupDone
  if (obj.sources && typeof obj.sources === "object") {
    const src = obj.sources as Record<string, unknown>
    for (const key of CHANNEL_KEYS) {
      if (typeof src[key] === "boolean") out.sources[key] = src[key] as boolean
    }
  }
  if (Array.isArray(obj.rssUrls)) {
    out.rssUrls = obj.rssUrls
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim())
      .slice(0, 10)
  }
  if (typeof obj.dwellSeconds === "number" && Number.isFinite(obj.dwellSeconds)) {
    out.dwellSeconds = Math.min(DWELL_MAX, Math.max(DWELL_MIN, Math.round(obj.dwellSeconds)))
  }
  if (typeof obj.newsMode === "string" && (NEWS_MODES as readonly string[]).includes(obj.newsMode)) {
    out.newsMode = obj.newsMode as NewsMode
  }
  if (obj.newsModes && typeof obj.newsModes === "object") {
    const nm = obj.newsModes as Record<string, unknown>
    for (const h of HOST_IDS) {
      if (typeof nm[h] === "string" && (NEWS_MODES as readonly string[]).includes(nm[h] as NewsMode)) {
        if (!out.newsModes) out.newsModes = {}
        out.newsModes[h] = nm[h] as NewsMode
      }
    }
  }
  return out
}

const configPath = () => join(homedir(), ".config", "waitfeed", "config.json")

export async function configExists(): Promise<boolean> {
  try {
    await readFile(configPath(), "utf8")
    return true
  } catch {
    return false
  }
}

export async function loadConfig(dir?: string): Promise<WaitFeedConfig> {
  // Default is the shared home anchor; an explicit dir exists so hosts that
  // stage data elsewhere (tests, --data-dir) read the config beside it.
  const base = dir ?? join(homedir(), ".config", "waitfeed")
  try {
    return normalizeConfig(JSON.parse(await readFile(join(base, "config.json"), "utf8")))
  } catch {
    return { ...DEFAULT_CONFIG, sources: { ...DEFAULT_CONFIG.sources }, rssUrls: [] }
  }
}

/** Atomic write (tmp + rename), same pattern as the cache file. */
export async function saveConfig(cfg: WaitFeedConfig, customDir?: string): Promise<void> {
  const dir = customDir ?? join(homedir(), ".config", "waitfeed")
  await mkdir(dir, { recursive: true })
  const path = join(dir, "config.json")
  const tmp = `${path}.${Date.now()}.tmp`
  await writeFile(tmp, JSON.stringify(cfg, null, 2), "utf8")
  await rename(tmp, path)
}
