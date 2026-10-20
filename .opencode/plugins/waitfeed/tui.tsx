// WaitFeed — TUI plugin.
//
// Slot A (session.composer.top): a rotating news card while the agent works —
// colored channel badge + headline, dim context beneath. NO fixed line count:
// the text is one wrapping paragraph and grows as tall as the news needs.
// Slot B (prompt.footer.status): a short "✓ done in Xm · N headlines seen"
// summary after a run. `/news` opens the full reader panel (esc closes,
// f toggles fullscreen).
//
// One consistent look, never mixed: while the LLM layer is on, only items
// whose story is ready become visible (headline + story + link). When the
// layer reports itself unavailable, the WHOLE view switches to headline mode
// (headline + description + link) — the two modes never appear together.
//
// The TUI never fetches feeds itself: the server-side plugin owns the
// pipeline and writes ~/.config/waitfeed/cache.json; this side polls the
// file. Zero keys, zero cloud, and typing is never intercepted.
import { For, Show, createSignal } from "solid-js"
import { spawn } from "node:child_process"
import { appendFile, readFile, stat, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { Plugin } from "@opencode/plugin/tui"
import type { PanelInput } from "@opencode/plugin/tui/context"
import {
  CHANNEL_KEYS,
  DEFAULT_CONFIG,
  configExists,
  loadConfig,
  saveConfig,
  type ChannelKey,
  type WaitFeedConfig,
} from "./core/config"
import { formatAgo, formatDuration, isContextDuplicate, linkLabel, truncate } from "./core/ticker"
import type { FeedItem } from "./core/types"

/** Bump on every edit — the debug log reports which build actually ran. */
const BUILD = "2026-10-20T08-45-clean-reader"

const ROTATE_MS = 9_000
const CACHE_POLL_MS = 5_000
const SUMMARY_MS = 6_000
const PANEL_ITEMS = 8

/** Fixed text-grade colors, distrotv-style — consistent across user themes. */
const MUTED = "#7d8590"
const TIP_COLOR = "#79c0ff"
const SELECT_COLOR = "#f0883e"
const BADGE_STYLE: Record<string, string> = {
  HN: "#ff6600",
  DEV: "#8a63f4",
  GH: "#3fb950",
  "R/PROG": "#e36ba0",
  RSS: "#d29922",
}
const badgeColor = (source: string): string => BADGE_STYLE[source] ?? MUTED

/** Reader number keys (1-4) map to config channel keys; badges are what the
 * items themselves carry. */
const CHANNEL_BADGES: Record<ChannelKey, string> = {
  hn: "HN",
  devto: "DEV",
  github: "GH",
  reddit: "R/PROG",
}

function columns(): number {
  try {
    return process.stdout.columns ?? 100
  } catch {
    return 100
  }
}

interface CacheFile {
  items: FeedItem[]
  fetchedAt: number
  summaries?: Record<string, { text: string; at: number }>
  llmUnavailable?: boolean
  tips?: string[]
}

const dataDir = () => join(homedir(), ".config", "waitfeed")
const debugPath = () => join(dataDir(), "debug.log")

/** Tiny file debug log, size-capped. Diagnoses what the TUI can't show us. */
async function debugLog(line: string): Promise<void> {
  try {
    const file = debugPath()
    const size = await stat(file).then((s) => s.size).catch(() => 0)
    if (size > 200_000) await writeFile(file, "", "utf8")
    await appendFile(file, `${new Date().toISOString()} ${line}\n`, "utf8").catch(() => {})
  } catch {
    // diagnostics must never break the plugin
  }
}

export default Plugin.define({
  id: "waitfeed",
  setup(context) {
    context.ui.toast.show({ message: "WaitFeed loaded", variant: "success" })
    void debugLog(`build ${BUILD}`)

    const cachePath = join(dataDir(), "cache.json")
    const readCache = async (): Promise<CacheFile | null> => {
      try {
        return JSON.parse(await readFile(cachePath, "utf8")) as CacheFile
      } catch {
        return null // no cache yet, or mid-write — next poll retries
      }
    }

    const [cache, setCache] = createSignal<CacheFile>({ items: [], fetchedAt: 0, summaries: {} })
    const [index, setIndex] = createSignal(0)
    const [summary, setSummary] = createSignal<string | null>(null)
    const [cfg, setCfg] = createSignal<WaitFeedConfig>({
      ...DEFAULT_CONFIG,
      sources: { ...DEFAULT_CONFIG.sources },
      rssUrls: [],
    })
    void loadConfig().then((c) => setCfg(c))

    const summaries = () => cache().summaries ?? {}
    const items = () => cache().items

    /** Story mode = the LLM layer is healthy. When it reports itself
     * unavailable (gate refusal or repeated upstream failure), the WHOLE view
     * switches to headline mode — the two looks are never mixed. */
    const storyMode = (): boolean => !(cache().llmUnavailable ?? false)
    const hasStory = (it: FeedItem): boolean => (summaries()[it.url]?.text ?? "").trim().length > 0

    /** The single source of the display rule: story-ready items in story
     * mode, every item in headline mode — and in both cases never a channel
     * the user switched off (RSS subscriptions always show). */
    const visible = (): FeedItem[] => {
      const on = new Set(CHANNEL_KEYS.filter((k) => cfg().sources[k]).map((k) => CHANNEL_BADGES[k]))
      return (storyMode() ? items().filter(hasStory) : items()).filter(
        (it) => it.source === "RSS" || on.has(it.source),
      )
    }

    const current = (): FeedItem | undefined => {
      const list = visible()
      if (list.length === 0) return undefined
      return list[index() % list.length]
    }

    /** Every 4th rotation slot is a personal tip from local git metadata —
     * the "▍ YOU" card. Tips arrive on the cache like everything else. */
    const TIP_EVERY = 4
    const currentTip = (): string | undefined => {
      const list = cache().tips ?? []
      if (list.length === 0) return undefined
      const i = index()
      return i % TIP_EVERY === TIP_EVERY - 1 ? list[i % list.length] : undefined
    }

    /** Card body: the item's LLM story when present, else the channel/meta
     * description. A body that just repeats the headline is dropped — no
     * value, no line. */
    const bodyOf = (it: FeedItem): string => {
      const raw = (summaries()[it.url]?.text ?? it.context ?? "").trim()
      if (!raw || isContextDuplicate(it.title, raw)) return ""
      return raw
    }

    // Poll the shared cache file (the server plugin owns writing it).
    let lastItemCount = -1
    const poll = async (): Promise<void> => {
      const next = await readCache()
      if (next && next.items.length > 0) {
        setCache(next)
        if (next.items.length !== lastItemCount) {
          lastItemCount = next.items.length
          void debugLog(`cache poll: ${next.items.length} items (fetchedAt ${next.fetchedAt})`)
        }
      }
    }
    void poll()
    const pollTimer = setInterval(() => void poll(), CACHE_POLL_MS)

    const rotateTimer = setInterval(() => {
      trackBusy()
      if (lastBusy) seen++ // rotated a new headline in front of the user
      setIndex((i) => i + 1)
    }, ROTATE_MS)

    // --- done-summary bookkeeping (observational: no keystrokes touched) ---
    let seen = 0
    let lastBusy = false
    let lastSessionID: string | undefined
    const busySince = new Map<string, number>()
    let summaryTimer: ReturnType<typeof setTimeout> | undefined

    /** Pull the state string out of whatever shape the status arrives in. */
    const stateOf = (raw: unknown): string | undefined => {
      if (typeof raw === "string") return raw
      if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>
        for (const key of ["status", "state", "type"]) {
          const value = stateOf(obj[key])
          if (value) return value
        }
      }
      return undefined
    }

    /** Only a confirmed "idle" hides the ticker. Known busy values ("running",
     * "retry", "busy") show it; anything unknown falls back to visible — the
     * proven M1 default that can never leave the ticker stuck hidden. */
    const isBusy = (sessionID?: string): boolean => {
      if (!sessionID) return false
      try {
        const state = stateOf(context.data.session.status(sessionID))
        if (state === undefined) return true
        return state !== "idle"
      } catch (err) {
        void debugLog(`status read FAILED: ${(err as Error)?.message ?? String(err)}`)
        return true
      }
    }

    /** Keeps the busy window for the done summary. Runs in the rotation tick —
     * always alive, no mount-order games. */
    const trackBusy = (): void => {
      const sid = lastSessionID
      const busy = isBusy(sid)
      if (busy !== lastBusy) {
        void debugLog(`busy flip: ${lastBusy} -> ${busy} (sid ${sid ?? "?"})`)
        lastBusy = busy
      }
      if (busy) {
        if (sid && !busySince.has(sid)) busySince.set(sid, Date.now())
      } else if (sid) {
        busySince.delete(sid)
      }
    }

    /** Ticker card, built only from proven primitives (separate colored
     * texts in a row). The title gets an explicit width so it WRAPS to as
     * many lines as the sentence needs — nothing is ever cut mid-word. The
     * body gets its own column (indent rendered as a separate text node) so
     * wrapped lines stay aligned with the first one instead of snapping to
     * the left edge. All glyphs are plain-ASCII-safe (no fancy arrows). */
    const NewsParagraph = (props: { item: FeedItem; withBar?: boolean }) => {
      const color = () => badgeColor(props.item.source)
      const ago = () => formatAgo(props.item.time)
      const body = () => bodyOf(props.item)
      const titleW = () => Math.max(40, columns() - 24)
      /** HN points / GH stars / DEV hearts — shown dim like the age stamp. */
      const score = (): string | undefined =>
        typeof props.item.score === "number" && props.item.score > 0
          ? `▲ ${props.item.score > 999 ? `${(props.item.score / 1000).toFixed(1)}k` : props.item.score}`
          : undefined
      return (
        <box>
          <box flexDirection="row" gap={1}>
            <Show when={props.withBar}>
              <text fg={color()}>▍</text>
            </Show>
            <text fg={color()}>{`[${props.item.source}]`}</text>
            <text width={titleW()}>{props.item.title}</text>
            <Show when={score()}>
              <text fg={MUTED}>{score()}</text>
            </Show>
            <Show when={ago()}>
              <text fg={MUTED}>{`· ${ago()}`}</text>
            </Show>
          </box>
          <Show when={body()}>
            <box flexDirection="row">
              <text fg={MUTED}>{"   "}</text>
              <text fg={MUTED} width={Math.max(40, columns() - 7)}>{body()}</text>
            </box>
          </Show>
          <Show when={props.item.url}>
            <text fg={MUTED} width={Math.max(40, columns() - 4)}>
              {`   > `}
              <a href={props.item.url}>
                {linkLabel(props.item.url, Math.max(40, columns() - 10))}
              </a>
            </text>
          </Show>
        </box>
      )
    }

    /** The "▍ YOU" card: one friendly git-metadata line from your own repo. */
    const TipParagraph = (props: { tip: string }) => (
      <box>
        <box flexDirection="row" gap={1}>
          <text fg={TIP_COLOR}>▍</text>
          <text fg={TIP_COLOR}>[YOU]</text>
          <text width={Math.max(40, columns() - 20)}>{props.tip}</text>
        </box>
      </box>
    )

    /** Reader row: ONE line per item — marker + badge + truncated title +
     * score + age. Only the selected row expands to show its story. Long
     * URLs never render as text (enter opens them). Plain-safe glyphs only. */
    const ReaderRow = (props: { item: FeedItem; selected: boolean; titleW: number }) => {
      const ago = () => formatAgo(props.item.time)
      const score = (): string | undefined =>
        typeof props.item.score === "number" && props.item.score > 0
          ? `▲ ${props.item.score > 999 ? `${(props.item.score / 1000).toFixed(1)}k` : props.item.score}`
          : undefined
      const body = () => bodyOf(props.item)
      return (
        <box>
          <box flexDirection="row" gap={1}>
            <text fg={props.selected ? SELECT_COLOR : MUTED}>{props.selected ? "▸" : " "}</text>
            <text fg={badgeColor(props.item.source)}>{`[${props.item.source}]`}</text>
            <text width={props.titleW}>{truncate(props.item.title, props.titleW)}</text>
            <Show when={score()}>
              <text fg={MUTED}>{score()}</text>
            </Show>
            <Show when={ago()}>
              <text fg={MUTED}>{`· ${ago()}`}</text>
            </Show>
          </box>
          <Show when={props.selected}>
            <Show when={body()}>
              <box flexDirection="row">
                <text fg={MUTED}>{"  "}</text>
                <text fg={MUTED} width={Math.max(40, columns() - 9)}>{body()}</text>
              </box>
            </Show>
          </Show>
        </box>
      )
    }

    // --- Slot A: the live ticker, visible only while the session is busy ---
    context.ui.slot({
      append: "session.composer.top",
      render: (props) => {
        lastSessionID = props.sessionID
        void debugLog(`slot A render: sid=${props.sessionID} idx=${index()}`)
        return (
          <Show when={isBusy(props.sessionID)}>
            <Show
              when={currentTip()}
              fallback={
                <Show when={current()}>
                  <NewsParagraph item={current() as FeedItem} withBar />
                </Show>
              }
            >
              <TipParagraph tip={currentTip() as string} />
            </Show>
          </Show>
        )
      },
    })

    // --- Slot B: one-line done summary after a run ---
    context.data.on("session.execution.succeeded", (event) => {
      const data = (event as { data?: { sessionID?: string } }).data
      const sid = data?.sessionID ?? lastSessionID
      const since = sid ? busySince.get(sid) : undefined
      if (sid) busySince.delete(sid)
      const ms = since ? Date.now() - since : 0
      const dur = ms > 5_000 ? ` in ${formatDuration(ms)}` : ""
      void debugLog(`execution succeeded sid=${sid ?? "?"} busyWindow=${ms}ms seen=${seen}`)
      setSummary(`✓ done${dur} · ${seen} headlines seen`)
      if (summaryTimer) clearTimeout(summaryTimer)
      summaryTimer = setTimeout(() => setSummary(null), SUMMARY_MS)
    })

    context.ui.slot({
      append: "prompt.footer.status",
      render: () => (
        <Show when={summary()}>
          <text fg="#3fb950">{summary()}</text>
        </Show>
      ),
    })

    // --- /news command + fullscreen reader panel ---
    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "waitfeed.news",
          title: "Open news reader",
          group: "WaitFeed",
          palette: true,
          slash: { name: "news" },
          enabled: () => true,
          suggested: true,
          run: () => {
            void debugLog("open /news panel")
            context.ui.panel.open("waitfeed.news", { presentation: "fullscreen" })
          },
        },
      ],
      bindings: ["waitfeed.news"],
    }))

    const NewsPanel = (props: { panel: PanelInput }) => {
      const [cursor, setCursor] = createSignal(0)

      // First run: materialize config.json on first open so setup has a real
      // file from day one; the key presses below then persist instantly.
      void (async () => {
        if (!(await configExists())) await saveConfig(cfg())
      })()

      /** Reader list — visible() already applies story mode + channel switches. */
      const readerList = (): FeedItem[] => visible()
      /** Cursor bounds clamp to what is actually on screen. */
      const shownMax = (): number => Math.max(0, Math.min(readerList().length, PANEL_ITEMS) - 1)
      const at = (): number => Math.min(cursor(), shownMax())
      const move = (delta: number): void => {
        const max = shownMax()
        setCursor((c) => Math.min(max, Math.max(0, Math.min(max, c) + delta)))
      }

      /** Cross-platform open in the user's browser. No shell strings —
       * arguments only; the detached child dies on its own. */
      const openUrl = (url: string): void => {
        try {
          const child =
            process.platform === "win32"
              ? spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" })
              : process.platform === "darwin"
                ? spawn("open", [url], { detached: true, stdio: "ignore" })
                : spawn("xdg-open", [url], { detached: true, stdio: "ignore" })
          child.unref()
          void debugLog(`open: ${url}`)
        } catch (err) {
          void debugLog(`open FAILED: ${(err as Error)?.message ?? String(err)}`)
        }
      }

      /** 1-4 in the reader: flips the channel switch AND persists it — the
       * next fetch cycle stops even contacting that source, and the card
       * disappears from the ticker immediately. */
      const toggleChannel = (key: ChannelKey): void => {
        const current = cfg()
        const next: WaitFeedConfig = {
          ...current,
          sources: { ...current.sources, [key]: !current.sources[key] },
          setupDone: true,
        }
        setCfg(next)
        void saveConfig(next)
          .then(() => debugLog(`config: ${key} -> ${next.sources[key] ? "on" : "off"}`))
          .catch((err) =>
            debugLog(`config save FAILED for ${key}: ${(err as Error)?.message ?? ""}`),
          )
      }

      // The host does not auto-bind Esc — the panel owns its keys.
      context.keymap.layer(() => ({
        commands: [
          { id: "waitfeed.news.close", bind: "escape", run: () => props.panel.close() },
          { id: "waitfeed.news.fullscreen", bind: "f", run: () => props.panel.toggleFullscreen() },
          { id: "waitfeed.news.up", bind: "up", run: () => move(-1) },
          { id: "waitfeed.news.vim-up", bind: "k", run: () => move(-1) },
          { id: "waitfeed.news.down", bind: "down", run: () => move(1) },
          { id: "waitfeed.news.vim-down", bind: "j", run: () => move(1) },
          {
            id: "waitfeed.news.open",
            bind: "enter",
            run: () => {
              const it = readerList()[at()]
              if (it && it.url && it.url.length > 0) openUrl(it.url)
            },
          },
          ...CHANNEL_KEYS.map((key, i) => ({
            id: `waitfeed.news.ch-${key}`,
            bind: `${i + 1}`,
            title: `${CHANNEL_BADGES[key]} on/off`,
            run: () => toggleChannel(key),
          })),
        ],
      }))
      const header = (): string =>
        storyMode()
          ? `WAITFEED — AI digests · ${visible().length} ready`
          : `WAITFEED — tech headlines · ${items().length} items · AI digest off`
      const emptyMessage = (): string =>
        items().length === 0
          ? "waiting for the first feed fetch…"
          : "writing stories for fresh headlines — the first ones land in seconds…"
      /** Header zone lines are ALL single strings with one color each: a
       * multi-node colored chips row once painted over the line below it on
       * some terminals. One string per line can never overlap. */
      const chips = (): string =>
        CHANNEL_KEYS.map(
          (k) => `${CHANNEL_KEYS.indexOf(k) + 1} ${CHANNEL_BADGES[k]} ${cfg().sources[k] ? "on" : "off"}`,
        ).join(" · ")
      const controls = "enter open · up/down move · f fullscreen · esc close"
      const titleW = (): number => Math.max(30, columns() - 24)
      return (
        <box flexDirection="column">
          <text fg="#ff6600">{header()}</text>
          <text fg={MUTED}>{chips()}</text>
          <text fg={MUTED}>{controls}</text>
          <Show when={!cfg().setupDone}>
            <text fg={MUTED}>
              {"first run — switches above save to ~/.config/waitfeed/config.json"}
            </text>
          </Show>
          <Show when={visible().length > 0} fallback={<text fg={MUTED}>{emptyMessage()}</text>}>
            <For each={visible().slice(0, PANEL_ITEMS)}>
              {(it, i) => <ReaderRow item={it} selected={i() === at()} titleW={titleW()} />}
            </For>
          </Show>
        </box>
      )
    }

    context.ui.slot({
      append: "session.panel",
      render: (panel) => (
        <Show when={panel.name === "waitfeed.news"}>
          <NewsPanel panel={panel} />
        </Show>
      ),
    })

    return () => {
      clearInterval(pollTimer)
      clearInterval(rotateTimer)
      if (summaryTimer) clearTimeout(summaryTimer)
    }
  },
})
