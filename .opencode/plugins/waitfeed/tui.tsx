/* @jsxImportSource @opentui/solid */
// WaitFeed — TUI plugin.
//
// Slot A (session.composer.top): a rotating news card while the agent works —
// colored channel badge + headline, dim context beneath. NO fixed line count:
// the text is one wrapping paragraph and grows as tall as the news needs.
// The rotation is no-repeat first: an unseen card plays before any seen one,
// and shown cards drift to the back of the line instead of looping instantly.
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
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js"
import { spawn } from "node:child_process"
import { appendFile, readFile, stat, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { Plugin } from "@opencode/plugin/tui"
import type { PanelInput } from "@opencode/plugin/tui/context"
import type { KeyEvent } from "@opentui/core"
import {
  CHANNEL_KEYS,
  DEFAULT_CONFIG,
  configExists,
  loadConfig,
  saveConfig,
  type ChannelKey,
  type WaitFeedConfig,
} from "./core/config"
import { formatAgo, formatDuration, formatMeta, isContextDuplicate, linkLabel, truncate } from "./core/ticker"
import type { FeedItem } from "./core/types"

/** Bump on every edit — the debug log reports which build actually ran. */
const BUILD = "2026-10-24-v11-safe-guards"

const CACHE_POLL_MS = 5_000
const SUMMARY_MS = 6_000
/** Reader rows — generous on purpose: the reader is where a headline that
 * rotated away gets re-read, so browsing should feel roomy. */
const PANEL_ITEMS = 12
/** Fixed text-grade colors, distrotv-style — consistent across user themes. */
const MUTED = "#7d8590"
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
    const [rotation, bumpRotation] = createSignal(0)
    const [summary, setSummary] = createSignal<string | null>(null)
    const [cfg, setCfg] = createSignal<WaitFeedConfig>({
      ...DEFAULT_CONFIG,
      sources: { ...DEFAULT_CONFIG.sources },
      rssUrls: [],
    })
    void loadConfig().then((c) => {
      setCfg(c)
      rescheduleRotate() // config may carry a custom dwellSeconds — apply live
    })

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

    /** No-repeat rotation. An unseen card is always the first choice
     * (newest-first); cards already shown this session drift to the BACK of
     * the line — a repeat only happens once everything currently visible has
     * been shown once, and then it is the card shown the LONGEST time ago.
     * The chosen card is pinned for its whole dwell, so a mid-dwell cache
     * poll can never swap the headline mid-read. */
    const shownAt = new Map<string, number>() // id -> presentation number
    let presentationNo = 0
    let pinnedId: string | undefined

    const current = (): FeedItem | undefined => {
      void rotation() // subscribe: each dwell tick re-picks
      const list = visible()
      if (list.length === 0) {
        pinnedId = undefined
        return undefined
      }
      const present = new Set(list.map((it) => it.id))
      for (const id of shownAt.keys()) if (!present.has(id)) shownAt.delete(id)
      const pinned = pinnedId ? list.find((it) => it.id === pinnedId) : undefined
      if (pinned) return pinned // one card, full dwell, never swapped mid-read
      let chosen: FeedItem | undefined
      const unseenIdx = list.findIndex((it) => !shownAt.has(it.id))
      if (unseenIdx >= 0) {
        chosen = list[unseenIdx]
      } else {
        // All shown at least once: least-recently-shown wins (back-of-line rule).
        let bestId: string | undefined
        let bestTick = Infinity
        for (const it of list) {
          const t = shownAt.get(it.id)
          if (t !== undefined && t < bestTick) {
            bestTick = t
            bestId = it.id
          }
        }
        chosen = bestId ? list.find((it) => it.id === bestId) : list[0]
      }
      pinnedId = chosen?.id
      return chosen
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
        // New stories / stories while the reader is open must repaint it.
        if (next.items.length !== lastItemCount) {
          lastItemCount = next.items.length
          try {
            context.renderer.requestRender()
          } catch {
            // renderer request is best-effort
          }
          void debugLog(`cache poll: ${next.items.length} items (fetchedAt ${next.fetchedAt})`)
        }
      }
    }
    void poll()
    const pollTimer = setInterval(() => void poll(), CACHE_POLL_MS)

    /** The single rotation tick, kept out of setInterval because the dwell
     * comes from the user config and can change on load. The card that just
     * finished its dwell is the pinned one; it is marked shown the moment its
     * dwell ends, so the next dwell picks the never-repeat order. */
    const rotationTick = (): void => {
      trackBusy()
      const shownId = pinnedId
      if (lastBusy) {
        // Count DISTINCT headlines actually displayed this run — a rotation
        // that shows the same card again is the same glance. Empty list
        // (stories still writing) = nothing seen, counted honestly.
        if (shownId && shownId !== lastShownId) {
          lastShownId = shownId
          seen++
        }
      }
      if (shownId) shownAt.set(shownId, ++presentationNo)
      pinnedId = undefined
      bumpRotation((n) => n + 1)
    }

    /** Card dwell: distrotv's 9s was tuned for a ONE-LINE ad. Our full card
     * (headline + story + link) reads in ~15-25s, so the default dwell is
     * 20s — the knob `dwellSeconds` in config.json sets it (5-120, clamped
     * on load). Rotating faster than the read is the mid-read pop-up bug. */
    const dwellMs = (): number => cfg().dwellSeconds * 1000
    let rotateTimer: ReturnType<typeof setInterval> | undefined
    const rescheduleRotate = (): void => {
      if (rotateTimer) clearInterval(rotateTimer)
      rotateTimer = setInterval(rotationTick, dwellMs())
    }
    rescheduleRotate()

    // --- done-summary bookkeeping (observational: no keystrokes touched) ---
    // `seen` = distinct headlines displayed during the CURRENT busy run: it
    // resets when the session turns busy and is snapshotted into the "✓ done"
    // summary when that run succeeds — so the number always describes the
    // run the user just watched, never a total from earlier runs.
    let seen = 0
    let lastShownId: string | undefined
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
     * always alive, no mount-order games. A busy flip STARTS a run: the seen
     * counter resets so the done summary describes exactly that run. */
    const trackBusy = (): void => {
      const sid = lastSessionID
      const busy = isBusy(sid)
      if (busy !== lastBusy) {
        void debugLog(`busy flip: ${lastBusy} -> ${busy} (sid ${sid ?? "?"})`)
        lastBusy = busy
        if (busy) {
          seen = 0 // fresh run → fresh count
          lastShownId = undefined
        }
      }
      if (busy) {
        if (sid && !busySince.has(sid)) busySince.set(sid, Date.now())
      } else if (sid) {
        busySince.delete(sid)
      }
    }

    /** Ticker card — the single-paragraph look with justified ends. Field
     * rules locked across 1.0.1/1.0.2 consumer runs:
     * 1) NO columns()-based sizing — the row spans width="100%" of its real
     *    parent box (the composer slot), so every width is the truth.
     * 2) The headline NEVER truncates: it is a flexGrow middle cell that
     *    wraps to as many lines as needed; nothing cuts it.
     * 3) Badge left, meta right, justified by the growing headline — meta
     *    stays pinned at the corner even when the headline is huge.
     * 4) Every piece owns its spacing inside its own string (a former gap
     *    rendering glued "[R/PROG]PHP2Shell"); meta text comes from the pure
     *    formatMeta() helper in reader order (points · age). */
    const NewsParagraph = (props: { item?: FeedItem; withBar?: boolean }) => {
      const it = () => props.item
      const color = () => (it() ? badgeColor(it()!.source) : MUTED)
      const body = () => (it() ? bodyOf(it()!) : "")
      const meta = (): string => (it() ? formatMeta(it()!.score, it()!.time) : "")
      return (
        <Show when={it()}>
          {(item) => (
            <box>
              <box flexDirection="row" width="100%" alignItems="flex-start">
                <text fg={color()}>{props.withBar ? `▍ [${item().source}]` : `[${item().source}]`}</text>
                <text flexGrow={1} flexBasis={0} minWidth={0}>
                  {item().title}
                </text>
                <Show when={meta()}>
                  <text fg={MUTED}>{meta()}</text>
                </Show>
              </box>
              <Show when={body()}>
                <text fg={MUTED}>{`   ${body()}`}</text>
              </Show>
              <Show when={item().url}>
                <text fg={MUTED}>
                  {`   > `}
                  <a href={item().url}>
                    {linkLabel(item().url, 48)}
                  </a>
                </text>
              </Show>
            </box>
          )}
        </Show>
      )
    }

    /** Reader row (SNAPSHOT variant): one line per item — marker + badge +
     * truncated title + score + age; only the selected row expands to its
     * story. Renders ONCE per reader repaint with plain values — the whole
     * row is painted on mount, so nothing here may depend on later
     * reactivity (reader state changes remount instead). Plain-safe glyphs
     * only; long URLs never render as text (enter opens them). */
    const ReaderRow = (props: { item?: FeedItem; selected: boolean; titleW: number }) => {
      const it = () => props.item
      const ago = () => (it() ? formatAgo(it()!.time) : "")
      const score = (): string | undefined => {
        const item = it()
        return item && typeof item.score === "number" && item.score > 0
          ? `▲ ${item.score > 999 ? `${(item.score / 1000).toFixed(1)}k` : item.score}`
          : undefined
      }
      const body = () => (it() ? bodyOf(it()!) : "")
      return (
        <Show when={it()}>
          {(item) => (
            <box>
              <box flexDirection="row" gap={1}>
                <text fg={props.selected ? SELECT_COLOR : MUTED}>{props.selected ? "▸" : " "}</text>
                <text fg={badgeColor(item().source)}>{`[${item().source}]`}</text>
                <text width={props.titleW}>{truncate(item().title, props.titleW)}</text>
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
          )}
        </Show>
      )
    }

    // --- Slot A: the live ticker, visible only while the session is busy ---
    context.ui.slot({
      append: "session.composer.top",
      render: (props) => {
        lastSessionID = props.sessionID
        void debugLog(`slot A render: sid=${props.sessionID} idx=${rotation()}`)
        return (
          <Show when={isBusy(props.sessionID)}>
            <Show when={current()}>
              {(item) => <NewsParagraph item={item()} withBar />}
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

      // Ensure the panel takes focus immediately on open
      try {
        props.panel.focus()
      } catch {
        // focus is best-effort on some host presentations
      }

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
        const next = Math.min(max, Math.max(0, cursor() + delta))
        void debugLog(`cursor -> ${next}/${max}`)
        setCursor(next)
        try {
          context.renderer.requestRender()
        } catch {
          // ignore
        }
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
        try {
          context.renderer.requestRender()
        } catch {
          // ignore
        }
        void saveConfig(next)
          .then(() => debugLog(`config: ${key} -> ${next.sources[key] ? "on" : "off"}`))
          .catch((err) =>
            debugLog(`config save FAILED for ${key}: ${(err as Error)?.message ?? ""}`),
          )
      }

      // Direct OpenTUI renderer keyboard listener.
      // Active for the lifetime of NewsPanel (onCleanup cleanly removes it).
      // Calls preventDefault() and stopPropagation() so keystrokes are handled
      // immediately without leaking into the host composer input.
      const handleKey = (key: KeyEvent): void => {
        if (key.eventType === "release") return
        if (key.ctrl) return // allow Ctrl+C to pass through to host

        const name = (key.name ?? "").toLowerCase()
        const seq = key.sequence ?? ""

        void debugLog(`keypress: name=${name} seq=${JSON.stringify(seq)}`)

        if (name === "escape" || seq === "\x1B") {
          key.preventDefault()
          key.stopPropagation()
          void debugLog("close panel via escape")
          try {
            props.panel.close()
          } catch {
            context.ui.panel.close()
          }
          return
        }
        if (name === "up" || name === "k" || seq === "k" || seq === "\x1B[A" || seq === "\x1BOA") {
          key.preventDefault()
          key.stopPropagation()
          move(-1)
          return
        }
        if (name === "down" || name === "j" || seq === "j" || seq === "\x1B[B" || seq === "\x1BOB") {
          key.preventDefault()
          key.stopPropagation()
          move(1)
          return
        }
        if (name === "enter" || name === "return" || name === "linefeed" || seq === "\r" || seq === "\n") {
          key.preventDefault()
          key.stopPropagation()
          const it = readerList()[at()]
          if (it && it.url && it.url.length > 0) openUrl(it.url)
          return
        }
        if (name === "f" || seq === "f") {
          key.preventDefault()
          key.stopPropagation()
          void debugLog("fullscreen toggle")
          try {
            props.panel.toggleFullscreen()
          } catch {
            // ignore
          }
          return
        }
        if (name === "1" || seq === "1") {
          key.preventDefault()
          key.stopPropagation()
          toggleChannel("hn")
          return
        }
        if (name === "2" || seq === "2") {
          key.preventDefault()
          key.stopPropagation()
          toggleChannel("devto")
          return
        }
        if (name === "3" || seq === "3") {
          key.preventDefault()
          key.stopPropagation()
          toggleChannel("github")
          return
        }
        if (name === "4" || seq === "4") {
          key.preventDefault()
          key.stopPropagation()
          toggleChannel("reddit")
          return
        }
      }

      context.renderer.keyInput.on("keypress", handleKey)
      onCleanup(() => {
        context.renderer.keyInput.off("keypress", handleKey)
      })

      // Secondary keymap layer registered with OpenCode host
      context.keymap.layer(() => ({
        mode: "global",
        priority: 100,
        commands: [
          {
            id: "waitfeed.news.close",
            bind: "escape",
            run: () => {
              try {
                props.panel.close()
              } catch {
                context.ui.panel.close()
              }
            },
          },
          {
            id: "waitfeed.news.fullscreen",
            bind: "f",
            run: () => {
              void debugLog("fullscreen toggle")
              try {
                props.panel.toggleFullscreen()
              } catch {
                // ignore
              }
            },
          },
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
        bindings: [
          "waitfeed.news.close",
          "waitfeed.news.fullscreen",
          "waitfeed.news.up",
          "waitfeed.news.vim-up",
          "waitfeed.news.down",
          "waitfeed.news.vim-down",
          "waitfeed.news.open",
          ...CHANNEL_KEYS.map((key) => `waitfeed.news.ch-${key}`),
        ],
      }))

      createEffect(() => {
        const rows = visible().length
        const on = cfg().sources
        void debugLog(
          `panel state: rows=${rows} cursor=${cursor()} ` +
            `hn=${on.hn ? 1 : 0} dev=${on.devto ? 1 : 0} gh=${on.github ? 1 : 0} r=${on.reddit ? 1 : 0}`,
        )
      })
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
      const rows = () => visible().slice(0, PANEL_ITEMS)

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
          <Show when={rows().length > 0} fallback={<text fg={MUTED}>{emptyMessage()}</text>}>
            <For each={rows()}>
              {(it, i) => (
                <ReaderRow
                  item={it}
                  selected={i() === at()}
                  titleW={titleW()}
                />
              )}
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
      if (rotateTimer) clearInterval(rotateTimer)
      if (summaryTimer) clearTimeout(summaryTimer)
    }
  },
})
