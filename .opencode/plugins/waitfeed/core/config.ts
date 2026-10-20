// WaitFeed user config — ~/.config/waitfeed/config.json.
//
// There is no separate installer step: the reader itself is the setup. The
// first /news open materializes the file with defaults, keys 1-4 toggle the
// channels and persist instantly. Unknown or half-written files always fall
// back to defaults — a hand-edited config can never break the ticker.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export const CHANNEL_KEYS = ["hn", "devto", "github", "reddit"] as const
export type ChannelKey = (typeof CHANNEL_KEYS)[number]

export interface WaitFeedConfig {
  /** False until the user's first keypress inside /news marks setup complete. */
  setupDone: boolean
  sources: Record<ChannelKey, boolean>
  /** Bring-your-own RSS/Atom channels (max 10) — badges as RSS. */
  rssUrls: string[]
  /** Personal "▍ YOU" slots from local git metadata only. */
  tips: boolean
}

export const DEFAULT_CONFIG: WaitFeedConfig = {
  setupDone: false,
  sources: { hn: true, devto: true, github: true, reddit: true },
  rssUrls: [],
  tips: true,
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
  if (typeof obj.tips === "boolean") out.tips = obj.tips
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

export async function loadConfig(): Promise<WaitFeedConfig> {
  try {
    return normalizeConfig(JSON.parse(await readFile(configPath(), "utf8")))
  } catch {
    return { ...DEFAULT_CONFIG, sources: { ...DEFAULT_CONFIG.sources }, rssUrls: [] }
  }
}

/** Atomic write (tmp + rename), same pattern as the cache file. */
export async function saveConfig(cfg: WaitFeedConfig): Promise<void> {
  const dir = join(homedir(), ".config", "waitfeed")
  await mkdir(dir, { recursive: true })
  const path = configPath()
  const tmp = `${path}.${Date.now()}.tmp`
  await writeFile(tmp, JSON.stringify(cfg, null, 2), "utf8")
  await rename(tmp, path)
}
