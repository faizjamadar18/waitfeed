/* @jsxImportSource @opentui/solid */
// WaitFeed — TUI plugin.
//
// Slot A (session.composer.top): a rotating news card while the agent works —
// colored channel badge + headline, dim context beneath. NO fixed line count:
// the text is one wrapping paragraph and grows as tall as the news needs.
// The rotation is no-repeat first: an unseen card plays before any seen one,
// and shown cards drift to the back of the line instead of looping instantly.
// Slot B (prompt.footer.status): clean ctrl+o feed status pill, visible only
// while the agent executes. When idle, OpenCode's bottom bar stays completely
// untouched. `/feed` opens the NATIVE OpenCode popup: type to search, the
// [Sources] row toggles channels by selection, and the honest SEEN/UPCOMING piles
// come from the reader ledger. No custom key handling.
// `ctrl+o` toggles the card during execution: press once to dismiss it while
// you focus on the code, again to bring it back. While idle, toggling and news
// are quiet.
//
// One consistent look across all hosts (OpenCode, Claude Code, AGY):
// channel badge + headline, dim context beneath, and origin link.
// Zero AI calls, zero token burn, zero keys.
//
// The TUI never fetches feeds itself: the server-side plugin owns the
// pipeline and writes ~/.config/waitfeed/cache.json; this side polls the
// file. Zero keys, zero cloud, and typing is never intercepted.
import { Show, createSignal } from "solid-js"
import { spawn } from "node:child_process"
import { appendFile, readFile, stat, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { Plugin } from "@opencode/plugin/tui"
import type { ColorInput } from "@opentui/core"
import {
  CHANNEL_BADGES,
  CHANNEL_KEYS,
  CHANNEL_NAMES,
  DEFAULT_CONFIG,
  channelForSource,
  getHostNewsMode,
  loadConfig,
  newsVisible,
  nextNewsMode,
  saveConfig,
  setHostNewsMode,
  type ChannelKey,
  type WaitFeedConfig,
} from "../core/config"
import {
  formatAgo,
  formatMeta,
  isContextDuplicate,
  linkLabel,
} from "../core/ticker"
import {
  emptyReaderState,
  groupItems,
  itemKey,
  loadReaderState,
  markItem,
  saveReaderState,
  type ReaderState,
} from "./reader-state"
import {
  applyTurnEnd,
  applyTurnStart,
  deleteTurnSession,
  isUserTurnTrigger,
  type TurnTransition,
} from "./turn-state"
import type { FeedItem } from "../core/types"

const BUILD = "2026-10-29-v22-no-glanced-label"

const CACHE_POLL_MS = 5_000
/** Ticker-glance writes batch behind this debounce: one save per rotation
 * lull, never one disk write per shown card. Reads still save instantly. */
const GLANCE_SAVE_DELAY_MS = 2_000
/** Fixed text-grade colors — consistent across user themes. */
const MUTED = "#7d8590"
const BADGE_STYLE: Record<string, string> = {
  HN: "#ff6600",
  DEV: "#8a63f4",
  GH: "#3fb950",
  REDDIT: "#e36ba0",
  "R/PROG": "#e36ba0",
  RSS: "#d29922",
}
const badgeColor = (source: string): string => BADGE_STYLE[source] ?? MUTED

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
    const [cfg, setCfg] = createSignal<WaitFeedConfig>({
      ...DEFAULT_CONFIG,
      sources: { ...DEFAULT_CONFIG.sources },
      rssUrls: [],
    })
    void loadConfig().then((c) => {
      const sanitized = getHostNewsMode(c, "opencode") === "show"
        ? setHostNewsMode(c, "opencode", "auto")
        : c
      const hasLiveTurnState =
        Object.keys(turnActiveMap()).length > 0 || Object.keys(turnDismissedMap()).length > 0
      const merged = hasLiveTurnState
        ? setHostNewsMode(sanitized, "opencode", getHostNewsMode(cfg(), "opencode"))
        : sanitized
      setCfg(merged)
      rescheduleRotate() // config may carry a custom dwellSeconds — apply live
      if (sanitized !== c) {
        void saveConfig(sanitized).catch(() => {})
      }
    })

    const items = () => cache().items

    /** The single source of the display rule: every item matching enabled channels
     * (RSS subscriptions always show). Filtering goes through channelForSource, so
     * the Reddit channel's stored "R/PROG" alias answers to the same switch as its
     * "REDDIT" badge. */
    const visible = (): FeedItem[] => {
      const on = new Set(CHANNEL_KEYS.filter((k) => cfg().sources[k]))
      return items().filter((it) => {
        if (it.source === "RSS") return true
        const key = channelForSource(it.source)
        return key !== undefined && on.has(key)
      })
    }

    // --- reader memory (survives restarts; the ledger only records facts
    // the software can prove): read = a keypress on the item, glanced = a
    // full dwell on the ticker. Reads save at once; glance writes batch.
    // The SEEN/UPCOMING piles are derived from here, never stored. ---
    const readerStatePath = join(dataDir(), "reader-state.json")
    const [rstate, setRstate] = createSignal<ReaderState>(emptyReaderState())
    void loadReaderState(readerStatePath).then((s) => setRstate(s))

    let glanceSaveTimer: ReturnType<typeof setTimeout> | undefined
    const persistReader = async (): Promise<void> => {
      try {
        await saveReaderState(readerStatePath, rstate())
      } catch (err) {
        void debugLog(`reader save FAILED: ${(err as Error)?.message ?? ""}`)
      }
    }

    const markGlanced = (it: FeedItem): void => {
      const key = itemKey(it)
      if (rstate().glanced[key]) return
      setRstate(markItem(rstate(), "glanced", key))
      if (glanceSaveTimer) clearTimeout(glanceSaveTimer)
      glanceSaveTimer = setTimeout(() => void persistReader(), GLANCE_SAVE_DELAY_MS)
    }

    const markRead = (it: FeedItem | undefined): void => {
      if (!it) return
      const key = itemKey(it)
      if (rstate().read[key]) return
      setRstate(markItem(rstate(), "read", key))
      if (glanceSaveTimer) clearTimeout(glanceSaveTimer) // the immediate save covers the pending glance too
      void persistReader()
    }

    /** Reader piles: SEEN (a mark of either kind exists) first, UPCOMING
     * (still waiting in line) below — derived live, never stored. */
    const readerGroups = () => groupItems(visible(), rstate())

    /** No-repeat rotation. An unseen card is always the first choice
     * (newest-first); cards already shown this session drift to the BACK of
     * the line — a repeat only happens once everything currently visible has
     * been shown once, and then it is the card shown the LONGEST time ago.
     * The chosen card is pinned for its whole dwell, so a mid-dwell cache
     * poll can never swap the headline mid-read. */
    const shownAt = new Map<string, number>() // id -> presentation number
    const shownTimestamps = new Map<string, number>() // id -> timestamp ms
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
      if (pinnedId && !shownTimestamps.has(pinnedId)) {
        shownTimestamps.set(pinnedId, Date.now())
      }
      return chosen
    }

    /** Card body: the channel/meta description. A body that just repeats the
     * headline is dropped — no value, no line. */
    const bodyOf = (it: FeedItem): string => {
      const raw = (it.context ?? "").trim()
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
      const shownId = pinnedId
      if (shownId) {
        shownAt.set(shownId, ++presentationNo)
        shownTimestamps.set(shownId, Date.now())
        // A full dwell on screen is a glance — recorded so the reader's SEEN
        // pile stays honest after a restart. Rotation behavior itself is
        // untouched: same tick, same marks, no gating added.
        const glanced = visible().find((it) => it.id === shownId)
        if (glanced) markGlanced(glanced)
      }
      pinnedId = undefined
      bumpRotation((n) => n + 1)
    }

    /** Card dwell: a full card (headline + story + link) reads in ~15-25s,
     * so the default dwell is 20s — the knob `dwellSeconds` in config.json
     * sets it (5-120, clamped on load). Rotating faster than the read is
     * the mid-read pop-up bug. */
    const dwellMs = (): number => cfg().dwellSeconds * 1000
    let rotateTimer: ReturnType<typeof setInterval> | undefined
    const rescheduleRotate = (): void => {
      if (rotateTimer) clearInterval(rotateTimer)
      rotateTimer = setInterval(rotationTick, dwellMs())
    }
    rescheduleRotate()

    let lastSessionID: string | undefined

    const trackActiveSession = (sessionID?: string): void => {
      if (sessionID) lastSessionID = sessionID
    }

    /** Resolves the currently active / focused session ID. */
    const getActiveSessionID = (): string | undefined => {
      try {
        const tabs = context.ui.tabs?.list?.()
        if (tabs && tabs.length > 0) {
          const active = tabs.find((t) => t.active)
          if (active?.sessionID) {
            lastSessionID = active.sessionID
            return active.sessionID
          }
        }
      } catch {
        // tabs not supported or failed
      }
      return lastSessionID
    }

    // Per-session reactive state maps:
    // Tracks active turns and dismissed states strictly by sessionID.
    // One session executing never bleeds into another session that is idle.
    const [turnActiveMap, setTurnActiveMap] = createSignal<Record<string, boolean>>({})
    const [turnDismissedMap, setTurnDismissedMap] = createSignal<Record<string, boolean>>({})

    const isTurnActive = (sessionID?: string): boolean => {
      if (!sessionID) return false
      return Boolean(turnActiveMap()[sessionID])
    }

    const isSessionDismissed = (sessionID?: string): boolean => {
      if (!sessionID) return false
      return Boolean(turnDismissedMap()[sessionID])
    }

    const setSessionDismissed = (sessionID: string | undefined, dismissed: boolean): void => {
      if (!sessionID) return
      setTurnDismissedMap((prev) => {
        if (Boolean(prev[sessionID]) === dismissed) return prev
        return { ...prev, [sessionID]: dismissed }
      })
    }

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

    /** Returns true only when a confirmed busy status is reported for THIS session.
     * When session state is idle, unknown, or not yet initialized, returns false
     * so OpenCode stays quiet and natural while idle. */
    const isBusy = (sessionID?: string): boolean => {
      if (!sessionID) return false
      try {
        const state = stateOf(context.data.session.status(sessionID))
        if (state) return state !== "idle"
      } catch (err) {
        void debugLog(`status read FAILED: ${(err as Error)?.message ?? String(err)}`)
      }
      try {
        const tab = context.ui.tabs?.list?.()?.find((t) => t.sessionID === sessionID)
        if (tab !== undefined) return tab.busy
      } catch {
        // ignore
      }
      return false
    }

    /** Waiting on the user is NOT executing: a pending permission request or
     * a pending question form means the agent paused for an answer, so the
     * ticker yields to the question. Same two reactive reads OpenCode's own
     * attention badge uses (permission.list / form.list lengths), so the
     * store updates arrive live and the slot re-evaluates on its own. A
     * failed read fails open to busy — the ticker never gets stuck hidden. */
    const waitingOnUser = (sessionID?: string): boolean => {
      if (!sessionID) return false
      try {
        const perms = context.data.session.permission.list(sessionID) ?? []
        if (perms.length > 0) return true
        const forms = context.data.session.form.list(sessionID) ?? []
        return forms.length > 0
      } catch (err) {
        void debugLog(`wait read FAILED: ${(err as Error)?.message ?? String(err)}`)
        return false
      }
    }

    /** Active execution state: true only when THIS session is executing a turn or
     * actively busy coding. Strictly false when this session is idle. */
    const isExecuting = (sessionID?: string): boolean => {
      const sid = sessionID ?? getActiveSessionID()
      if (!sid) return false
      return isTurnActive(sid) || isBusy(sid)
    }

    const isCurrentlyWorking = (sessionID?: string): boolean => {
      const sid = sessionID ?? getActiveSessionID()
      if (!sid || isSessionDismissed(sid)) return false
      return isExecuting(sid)
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

    // --- Slot A: the live ticker, visible only while the session EXECUTES ---
    // Hidden when the session is idle and when the agent is waiting on the
    // user (a question or a permission request). Strictly per session.
    context.ui.slot({
      append: "session.composer.top",
      render: (props) => {
        trackActiveSession(props.sessionID)
        const sid = () => props.sessionID
        const busy = () => isCurrentlyWorking(sid())
        const waiting = () => waitingOnUser(sid())
        const mode = () => getHostNewsMode(cfg(), "opencode")
        const show = () =>
          isExecuting(sid()) && !isSessionDismissed(sid()) && newsVisible(mode(), busy(), waiting())
        void debugLog(`slot A render: sid=${props.sessionID} idx=${rotation()} mode=${mode()}`)
        return (
          <Show when={!waiting() && show()}>
            <Show when={current()}>
              {(item) => <NewsParagraph item={item()} withBar />}
            </Show>
          </Show>
        )
      },
    })

    const applyTransition = (next: TurnTransition, logLine: string): void => {
      if (!next.changed) return
      setTurnActiveMap(next.active)
      setTurnDismissedMap(next.dismissed)
      if (next.cfg !== cfg()) {
        setCfg(next.cfg)
        void saveConfig(next.cfg).catch(() => {})
      }
      try {
        context.renderer?.requestRender()
      } catch {
        // best-effort
      }
      void debugLog(logLine)
    }

    // --- Turn Lifecycle: immediate appear on Enter, preserve ctrl+o hide throughout the run ---
    const onTurnStart = (sessionID?: string): void => {
      const activeSid = getActiveSessionID()
      const sid = sessionID ?? activeSid
      if (!sid) return
      if (!activeSid || sid === activeSid) trackActiveSession(sid)
      const next = applyTurnStart(
        { active: turnActiveMap(), dismissed: turnDismissedMap() },
        cfg(),
        sid,
        activeSid,
      )
      applyTransition(next, `turn start: sid=${sid}`)
    }

    const onTurnEnd = (sessionID?: string): void => {
      const activeSid = getActiveSessionID()
      const sid = sessionID ?? activeSid
      const next = applyTurnEnd(
        { active: turnActiveMap(), dismissed: turnDismissedMap() },
        cfg(),
        sid,
        activeSid,
      )
      applyTransition(next, `turn end: sid=${sid ?? "?"}`)
    }

    context.data.on("session.inbox.enqueued", (event) => {
      const data = (event as { data?: { sessionID?: string; item?: { type?: string } } }).data
      if (!isUserTurnTrigger(data?.item?.type)) return
      onTurnStart(data?.sessionID)
    })

    context.data.on("session.execution.started", (event) => {
      const sid = (event as { data?: { sessionID?: string } }).data?.sessionID
      onTurnStart(sid)
    })

    context.data.on("session.execution.failed", (event) => {
      const sid = (event as { data?: { sessionID?: string } }).data?.sessionID
      onTurnEnd(sid)
    })

    context.data.on("session.execution.interrupted", (event) => {
      const sid = (event as { data?: { sessionID?: string } }).data?.sessionID
      onTurnEnd(sid)
    })

    context.data.on("session.idle", (event) => {
      const sid = (event as { data?: { sessionID?: string } }).data?.sessionID
      onTurnEnd(sid)
    })

    context.data.on("session.execution.succeeded", (event) => {
      const sid = (event as { data?: { sessionID?: string } }).data?.sessionID
      onTurnEnd(sid)
    })

    context.data.on("session.deleted", (event) => {
      const sid = (event as { data?: { sessionID?: string } }).data?.sessionID
      if (sid) {
        const cleaned = deleteTurnSession(
          { active: turnActiveMap(), dismissed: turnDismissedMap() },
          sid,
        )
        setTurnActiveMap(cleaned.active)
        setTurnDismissedMap(cleaned.dismissed)
      }
    })

    // --- Slot B: bottom bar status pill, visible ONLY while THIS session executes ---
    // When idle, OpenCode's bottom bar is rendered natural and untouched.
    context.ui.slot({
      append: "prompt.footer.status",
      render: (props) => {
        if (props?.sessionID) trackActiveSession(props.sessionID)
        const sid = () => props?.sessionID ?? getActiveSessionID()
        const active = () => isExecuting(sid()) && !waitingOnUser(sid())
        const keyCol = (): ColorInput => context.theme?.text?.base ?? "#eeeeee"
        const textCol = (): ColorInput => context.theme?.text?.muted ?? "#808080"
        return (
          <Show when={active()}>
            <box flexDirection="row" alignItems="center" flexWrap="no-wrap">
              <text fg={keyCol()} wrapMode="none">ctrl+o</text>
              <text fg={textCol()} wrapMode="none"> feed</text>
            </box>
          </Show>
        )
      },
    })

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

    // --- /feed opens the NATIVE OpenCode popup (same as previously): the
    // host provides the search bar, scrolling and description text. On top
    // of it: the [Sources] row (opens a second popup where selecting a
    // source flips it — no keys), and two section rows, SEEN and UPCOMING,
    // filled from the reader ledger. Choosing a headline opens its link and
    // records the read; pressing nothing else ever intercepts the keys. ---
    const openFeedToggleMenu = async (): Promise<void> => {
      const toggleOptions: { title: string; value: string; description: string }[] = CHANNEL_KEYS.map((key) => {
        const isEnabled = cfg().sources[key]
        return {
          title: `[${CHANNEL_BADGES[key]}] ${CHANNEL_NAMES[key]} — currently ${isEnabled ? "ON (select to turn OFF)" : "OFF (select to turn ON)"}`,
          value: key,
          description: isEnabled
            ? `Feeds from ${CHANNEL_NAMES[key]} will be hidden from the ticker and reader.`
            : `Feeds from ${CHANNEL_NAMES[key]} will be fetched and shown on the ticker.`,
        }
      })
      toggleOptions.push({
        title: "← Back to News Reader",
        value: "__back__",
        description: "Return to the news reader.",
      })

      const chosenPromise = context.ui.dialog.select<string>({
        title: "WaitFeed — Sources (Toggle On/Off)",
        placeholder: "Select a source to toggle ON/OFF...",
        options: toggleOptions,
      })
      // Same rule as the reader: size on the active dialog at open time only.
      try {
        context.ui.dialog.set({ size: "large" })
      } catch {
        // not active yet — the retry below covers it
      }
      setTimeout(() => {
        try {
          context.ui.dialog.set({ size: "large" })
        } catch {
          // ignore
        }
      }, 0)

      const chosenKey = await chosenPromise

      if (chosenKey && chosenKey !== "__back__") {
        toggleChannel(chosenKey as ChannelKey)
        await openFeedToggleMenu() // stay in the menu so several switches happen in one visit
      } else if (chosenKey === "__back__") {
        await openNewsDialog()
      }
    }

    const openNewsDialog = async (): Promise<void> => {
      void debugLog("open /feed dialog")
      const currentItems = visible()
      if (currentItems.length === 0) {
        context.ui.toast.show({
          message:
            items().length === 0
              ? "WaitFeed: waiting for first feed fetch…"
              : "WaitFeed: writing digests — check back in a few seconds",
          variant: "info",
        })
        return
      }
      const g = readerGroups()

      /** One popup row per item: badge + title, the native description text
       * (body only — the link opens on Enter), and an honest footer — your
       * own read time when it exists, then score and age.
       * `category` makes the host draw a real bold section header with a
       * spacing line above the group — no fake rows needed. */
      type NewsOption = { title: string; value: string; description?: string; footer?: string; category?: string }
      const optionFor = (it: FeedItem): NewsOption => {
        const key = itemKey(it)
        const state = rstate()
        const score =
          typeof it.score === "number" && it.score > 0
            ? `▲ ${it.score > 999 ? `${(it.score / 1000).toFixed(1)}k` : it.score}`
            : ""
        const ago = it.time ? formatAgo(it.time) : ""
        // Row footer = score + age only. The auto "glanced" label was
        // bookkeeping — printing it on every row ate headline width; the
        // ledger keeps deciding the SEEN/UPCOMING piles. A row you OPENED
        // yourself still shows its read time.
        const readAt = state.read[key]
        const when = readAt ? `read ${formatAgo(readAt)}` : ""
        const footer = [when, score, ago].filter(Boolean).join(" · ")
        return {
          title: `[${it.source}] ${it.title}`,
          value: it.url,
          description: bodyOf(it) || undefined,
          footer: footer.length > 0 ? footer : undefined,
        }
      }

      // Channel switcher first — selecting it opens the toggle popup.
      const options: NewsOption[] = []
      options.push({
        title: `[Sources] ${CHANNEL_KEYS.map((k) => `${CHANNEL_BADGES[k]}: ${cfg().sources[k] ? "ON" : "OFF"}`).join(" · ")}`,
        value: "__toggle_feeds__",
        description: "Select to turn Hacker News, Dev.to, GitHub, or Reddit ON/OFF.",
      })

      // SEEN and UPCOMING are native section headers: the host prints the
      // category bold above its pile, with one blank line above each header —
      // that is the gap after [Sources] and between the two piles.
      if (g.seen.length > 0) {
        const seenCategory = `SEEN — already brought to you (${g.seen.length})`
        for (const it of g.seen) options.push({ ...optionFor(it), category: seenCategory })
      }
      if (g.upcoming.length > 0) {
        const upcomingCategory = `UPCOMING — new to you (${g.upcoming.length})`
        for (const it of g.upcoming) options.push({ ...optionFor(it), category: upcomingCategory })
      }

      // Width: the size is a presentation option of the ACTIVE dialog —
      // select() args ignore it (no `size` field in the option types). Set it
      // exactly when the popup opens: synchronous (before the first paint),
      // then once more next tick in case activation lags that same tick.
      // Nothing fires later — late re-measures of a live dialog cut its top.
      const chosenPromise = context.ui.dialog.select<string>({
        title: `WaitFeed — News Reader (seen ${g.seen.length} · upcoming ${g.upcoming.length})`,
        placeholder: "Type to search headlines or sources (hn, gh, dev, reddit)...",
        options,
      })
      try {
        context.ui.dialog.set({ size: "xlarge" })
      } catch {
        // not active yet — the retry below covers it
      }
      setTimeout(() => {
        try {
          context.ui.dialog.set({ size: "xlarge" })
        } catch {
          // ignore
        }
      }, 0)

      const chosen = await chosenPromise

      if (!chosen) return
      if (chosen === "__toggle_feeds__") {
        await openFeedToggleMenu()
      } else if (chosen.length > 0) {
        openUrl(chosen)
        markRead(currentItems.find((it) => it.url === chosen)) // opening it is proof the user chose to read it
      }
    }

    // --- show / hide the card on demand (strictly for the active session) ---
    // When the active session is idle, toggling is disabled and the card is quiet.
    // When executing, ctrl+o flips visibility between dismissed and visible for THIS session.
    const toggleNews = (): void => {
      const sid = getActiveSessionID()
      if (!sid || !isExecuting(sid)) return
      const currentMode = getHostNewsMode(cfg(), "opencode")
      const visibleNow = !isSessionDismissed(sid) && newsVisible(currentMode, isCurrentlyWorking(sid), waitingOnUser(sid))
      const nextMode = nextNewsMode(visibleNow)
      if (visibleNow) {
        setSessionDismissed(sid, true)
      } else {
        setSessionDismissed(sid, false)
      }
      const next: WaitFeedConfig = setHostNewsMode(cfg(), "opencode", nextMode)
      setCfg(next)
      try {
        context.renderer.requestRender()
      } catch {
        // renderer request is best-effort
      }
      void saveConfig(next)
        .then(() => debugLog(`opencode newsMode -> ${nextMode} for sid=${sid}`))
        .catch((err) =>
          debugLog(`newsMode save FAILED: ${(err as Error)?.message ?? String(err)}`),
        )
    }

    // --- /feed command → the native popup above; ctrl+o toggles the card ---
    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "waitfeed.feed",
          title: "Open feed reader",
          group: "WaitFeed",
          palette: true,
          slash: { name: "feed" },
          enabled: () => true,
          suggested: true,
          run: () => {
            void openNewsDialog()
          },
        },
        {
          id: "waitfeed.toggle",
          title: "Show / hide the news card",
          description: "Bring the news back on demand — or dismiss it while you focus on the code.",
          group: "WaitFeed",
          palette: true,
          // ctrl+o is unused by every OpenCode default (verified against the
          // keybinds docs); the layer owns the binding via `bindings` below.
          bind: "ctrl+o",
          enabled: () => isExecuting(getActiveSessionID()),
          run: () => {
            toggleNews()
          },
        },
      ],
      bindings: ["waitfeed.feed", "waitfeed.toggle"],
    }))

    return () => {
      clearInterval(pollTimer)
      if (rotateTimer) clearInterval(rotateTimer)
      if (glanceSaveTimer) clearTimeout(glanceSaveTimer)
    }
  },
})
