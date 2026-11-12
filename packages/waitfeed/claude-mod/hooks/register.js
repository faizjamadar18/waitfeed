// WaitFeed — Claude Code mod: news while your agent works.
//
// While Claude executes, the band above the prompt shows the same rotating
// news card the other hosts render. Type /feed and the reader pane opens:
// press a headline and the link opens in your browser while the row is
// marked read. Press ctrl+n (bound by `waitfeed init` to this mod's own
// /waitfeed command) to hide the card, and press it again to bring it back:
// the mod owns the toggle, so it always reverses — the host's own ctrl+x
// ctrl+a is a separate switch that collapses the whole band. Everything
// renders FROM the shared cache
// (~/.config/waitfeed/cache.json) that the fetch pipeline keeps fresh —
// this mod never fetches. Strictly observational: it draws, and it never
// touches prompts, tools, or Claude's behavior.
//
// Written to the mods docs (code.claude.com/docs/en/plugins/mods, fetched
// 2026-10-29) and the build's own type declarations (the copy Claude Code
// writes at install, checked 2026-11-12 against v2.1.322): every event name
// is a string literal, every `$` call is written in full and `$` only reaches
// the top-level functions of this file, and there are NO inbound module paths
// — a hooks module has no Node.js APIs, so files, env, processes and timers
// all go through the mods API ($.fs, $.env, $.process, $.clock) and drawing
// goes through $.ui.
//
// Needs Claude Code v2.1.295+ (rows of buttons with children) and v2.1.290+
// for the AbovePrompt band. Verified live on 2.1.311; see the companion
// README and the tests in the repo.
//
// The pane is a sticky-cursor list, built on the mods events the build's
// type declarations (claude-code.d.ts, the 2.1.277 copy on GitHub) name:
// arrows and the wheel raise `ui.scroll` over the pane (origin person, by
// ±1 for an arrow, `pointer` only on wheel ticks, and only while the
// window still has rows to move). The ui.scroll hook below consumes
// those, walks the focus ring one pressable row per step with $.ui.focus,
// and slides the window FOR the cursor least-wise with $.ui.scroll
// (block: 'nearest' — not at all when it already shows). PageUp, PageDown,
// Home and End ride next(e) and keep their documented job. Every draw is
// one line per headline, so the ring, the window rows and the press rows
// count the same rows.

const PANE = 'waitfeed'
const TICKER_DWELL_MS = 20_000
const PANE_MAX_ROWS = 100
const MARK_MAX_AGE_MS = 36 * 60 * 60 * 1000

// Module state — renders READ these; only refresh() and markRead() WRITE,
// and both are top-level functions this file owns, as validation requires.
let cacheItems = []
let newsConfig = null
let seen = { read: {}, glanced: {} }
let cursor = 0
// The cursor: where the focus ring sits, starting (and resuming a fresh
// open) on the first UPCOMING row; and the Button keys in pane draw
// order, refilled at every render of our pane.
let ringKey = 'up-0'
let rowKeys = []
// The band card's own show/hide, flipped by ctrl+n through /waitfeed. It lives
// in this session only; the shared `newsMode` switch still works from any host.
let cardHidden = false

/** The dedupe key — the same url/id rule every host groups by. */
function itemKeyOf(it) {
  return String((it.url || it.id) || '').trim().toLowerCase()
}

/** "2h" — the age suffix shared with the other hosts' rows. */
function agoOf(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  return Math.floor(h / 24) + 'd'
}

/** Marks age out at the window the cache keeps items — both piles together. */
function pruneState(state) {
  const floor = Date.now() - MARK_MAX_AGE_MS
  const out = { read: {}, glanced: {} }
  for (const [key, at] of Object.entries(state.read || {})) if (at > floor) out.read[key] = at
  for (const [key, at] of Object.entries(state.glanced || {})) if (at > floor) out.glanced[key] = at
  return out
}

/** The row meta. The only auto label kept is a read YOU made ("read 2m");
 * a ticker glance decides the piles but is never printed on a row. */
function metaOf(it, withRead) {
  const key = itemKeyOf(it)
  const bits = []
  if (withRead && seen.read[key]) bits.push('read ' + agoOf(seen.read[key]))
  if (it.score) bits.push('▲ ' + it.score)
  if (it.time) bits.push(agoOf(it.time))
  return bits.join(' · ')
}

/** The two piles the shared ledger defines: one mark of either kind —
 * read OR glanced — puts an item in SEEN, exactly like the OpenCode reader. */
function groupItems(items) {
  const seenPile = []
  const upcoming = []
  for (const it of items) {
    const key = itemKeyOf(it)
    const at = Math.max(seen.read[key] || 0, seen.glanced[key] || 0)
    if (at > 0) seenPile.push({ it, at })
    else upcoming.push(it)
  }
  seenPile.sort((a, b) => b.at - a.at)
  return { seen: seenPile.map((s) => s.it), upcoming }
}

/** The Button key one cursor step up or down from the ring, in pane draw
 * order. Where the ring's own row left the draw (a refresh reshaped the
 * piles), a down reseats on the first drawn row and an up stays put. */
function neighborRowKey(dir) {
  let at = rowKeys.indexOf(ringKey)
  if (at < 0) at = dir > 0 ? -1 : 0
  return rowKeys[at + dir] || null
}

/** `$.fs.read` resolves to the file's text; tolerate a wrapped shape too. */
async function parseFile($, path) {
  const out = await $.fs.read(path)
  const text = typeof out === 'string' ? out : String((out && out.text) || '')
  if (!text.trim()) return null
  return JSON.parse(text)
}

/** The shared dir every host anchors at: home + /.config/waitfeed — never a
 * cwd (the mod may run from any project on this machine). */
async function waitFeedDir($) {
  const winHome = await $.env.get('USERPROFILE')
  const home = winHome || (await $.env.get('HOME')) || ''
  return home.replace(/\\/g, '/') + '/.config/waitfeed'
}

/** Re-read the shared cache + ledger. Any failure keeps the previous state:
 * the cache is only ever written by the fetch pipeline, never here. */
async function refresh($) {
  const dir = await waitFeedDir($)
  let data = null
  try {
    data = await parseFile($, dir + '/cache.json')
  } catch {
    data = null
  }
  cacheItems = Array.isArray(data && data.items) ? data.items.filter((it) => it && it.title) : []
  let cfg = null
  try {
    cfg = await parseFile($, dir + '/config.json')
  } catch {
    cfg = null
  }
  newsConfig = cfg && typeof cfg === 'object' && !Array.isArray(cfg) ? cfg : null
  let ledger = null
  try {
    ledger = await parseFile($, dir + '/reader-state.json')
  } catch {
    ledger = null
  }
  seen = pruneState({
    read: ledger && typeof ledger.read === 'object' ? ledger.read : {},
    glanced: ledger && typeof ledger.glanced === 'object' ? ledger.glanced : {},
  })
}

/** Mark read + write the ledger back. Read again right before writing (the
 * mods docs' advice for values several sessions change) so a glance another
 * host recorded between our load and this press survives. `$.fs.write` is
 * not atomic — the OpenCode TUI owns the atomic write path; a race here is
 * milliseconds wide and loses at most one mark, never the file's shape. */
async function markRead($, it) {
  const key = itemKeyOf(it)
  if (!key) return
  const dir = await waitFeedDir($)
  let state = null
  try {
    const ledger = await parseFile($, dir + '/reader-state.json')
    state = ledger && typeof ledger.read === 'object' ? ledger : { read: {}, glanced: {} }
  } catch {
    state = seen
  }
  state = pruneState(state)
  state.read[key] = Date.now()
  seen = state
  await $.fs.write(dir + '/reader-state.json', JSON.stringify(state, null, 2))
}

/** Open the link in the user's browser. Argument list, no shell — the way
 * $.process.run works: it rejects when a program cannot start, so each
 * path falls back to the next. Windows leads with rundll32: one program
 * whose arguments pass verbatim (no shell, no empty console title), so
 * FileProtocolHandler hands the URL straight to the browser association.
 * `start` needs an empty console title as its first argument, which the
 * arg-list run has been seen to mangle — it stays as the fallback. */
async function openLink($, url) {
  const os = await $.env.get('OS')
  if (os === 'Windows_NT') {
    try {
      await $.process.run(['rundll32', 'url.dll,FileProtocolHandler', url])
    } catch {
      await $.process.run(['cmd', '/c', 'start', '', url])
    }
    return
  }
  try {
    await $.process.run(['open', url])
  } catch {
    await $.process.run(['xdg-open', url])
  }
}

// --- The band card (the ticker above the prompt) ---------------------------
//
// The same rotating card the other hosts draw, now in Claude Code's band
// instead of the status line: the channel-colored badge, the clean headline,
// the muted score/age meta, the muted description, and the origin link. It
// renders FROM the shared cache only — never a fetch — and rides the host's
// own busy truth (`e.props.isWorking`) instead of the old activity ledger.
// The shared `newsMode` switch can still silence it mid-run.

/** The ticker bar every host draws before the badge. */
const BAR = '▍'
/** How many rows the description may take — the other hosts' cap. */
const DESC_MAX_ROWS = 3
/** The origin row's marker — the other hosts print `> label`. */
const LINK_MARKER = '> '

/** Per-channel badge hues — the exact hexes the OpenCode news panel uses
 * (core/agy.ts mirrors these as xterm-256). An unmapped source falls back to
 * the muted gray those panels also use (dimColor). Claude Code's band takes a
 * raw color (a name or hex) for `Text.color`, so the hexes ride through. */
const CHANNEL_COLOR = {
  HN: '#ff6600', // HN orange
  GH: '#3fb950', // GitHub green
  DEV: '#8a63f4', // Dev.to violet
  REDDIT: '#e36ba0', // Reddit pink
  'R/PROG': '#e36ba0', // Reddit channel alias
  RSS: '#d29922', // RSS amber
}

/** Which channel a stored source belongs to — the shared reader/channel
 * rule (core/config.ts channelForSource). Undefined for the always-on RSS
 * pseudo-channel and anything unknown. */
function channelKeyOf(source) {
  if (source === 'HN') return 'hn'
  if (source === 'DEV') return 'devto'
  if (source === 'GH') return 'github'
  if (source === 'REDDIT' || source === 'R/PROG') return 'reddit'
  return undefined
}

/** Channels the user switched off vanish, RSS always shows — the same filter
 * every host applies (core/agy.ts agyVisibleItems). */
function visibleItems(items, cfg) {
  if (!cfg || !cfg.sources || typeof cfg.sources !== 'object') return items
  return items.filter((it) => {
    if (it.source === 'RSS') return true
    const key = channelKeyOf(it.source)
    return key !== undefined && cfg.sources[key] === true
  })
}

/** The effective newsMode for this host (core/config.ts getHostNewsMode): the
 * per-host override wins, the shared mode is the fallback, `auto` the
 * default. Only `hide` silences the card mid-run. */
function newsModeOf(cfg) {
  const modes = cfg && cfg.newsModes && typeof cfg.newsModes === 'object' ? cfg.newsModes : null
  const host = modes ? modes.claude : undefined
  if (host === 'auto' || host === 'show' || host === 'hide') return host
  const shared = cfg ? cfg.newsMode : undefined
  if (shared === 'auto' || shared === 'show' || shared === 'hide') return shared
  return 'auto'
}

/** "▲ 4.0k · 2h" — the shared ticker meta (core/ticker.ts formatMeta): points
 * first, age second, either half optional. */
function tickerMeta(it) {
  const bits = []
  const score = it.score
  if (typeof score === 'number' && score > 0) {
    bits.push('▲ ' + (score > 999 ? (score / 1000).toFixed(1) + 'k' : String(score)))
  }
  const at = it.time
  if (at) {
    const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
    if (s < 60) bits.push('now')
    else if (s < 3600) bits.push(Math.floor(s / 60) + 'm')
    else if (s < 86400) bits.push(Math.floor(s / 3600) + 'h')
    else bits.push(Math.floor(s / 86400) + 'd')
  }
  return bits.join(' · ')
}

/** The link label — host + path, scheme dropped (the full URL stays the open
 * target; only the drawn text shortens). */
function linkTextOf(url) {
  try {
    const u = new URL(url)
    return u.host + (u.pathname === '/' ? '' : u.pathname) + u.search
  } catch {
    return url
  }
}

/** The description, bounded to the other hosts' three rows: the stored text
 * is collapsed to prose and cut at a word boundary with an ellipsis — the
 * view shrinks, the stored data never does. */
function descTextOf(it, bodyColumns) {
  const raw = typeof it.context === 'string' ? it.context.replace(/\s+/g, ' ').trim() : ''
  if (!raw) return ''
  const columns = typeof bodyColumns === 'number' && bodyColumns > 0 ? bodyColumns : 80
  const budget = Math.max(40, Math.floor(columns) * DESC_MAX_ROWS)
  if (raw.length <= budget) return raw
  const cut = raw.slice(0, budget)
  const at = cut.lastIndexOf(' ')
  return (at > 0 ? cut.slice(0, at) : cut) + '...'
}

export function register(on) {
  // Runs before your first prompt, and again after every reload.
  on('session.start', async ($, e, next) => {
    // /feed — immediate lets the pane open while Claude is working.
    try {
      await $.command.register({
        name: 'feed',
        description: 'Open the WaitFeed feed reader pane',
        immediate: true,
      })
    } catch {
      // A taken command name must not kill the rest of the session start.
    }
    // /waitfeed — the card's own show/hide. ctrl+n is bound to this command
    // (see `waitfeed init`), so the key is a plain command run: the mod flips
    // its own flag and redraws, and the same key always reverses it. It must
    // be immediate so the key works mid-turn, while the card is showing.
    try {
      await $.command.register({
        name: 'waitfeed',
        description: 'Show or hide the WaitFeed news card',
        immediate: true,
      })
    } catch {
      // Same: a taken name must not kill the rest of the session start.
    }
    try {
      await refresh($)
    } catch {
      // No cache yet — the first pipeline cycle fills it; empty states draw.
    }
    // Rotation: the same wall-clock dwell the other hosts use. The timer
    // also re-reads the cache the pipeline may have rewritten since, then
    // asks Claude Code to draw our render sites again.
    $.clock.every(TICKER_DWELL_MS, async () => {
      try {
        await refresh($)
        cursor = (cursor + 1) % Math.max(1, cacheItems.length)
      } catch {
        // A failed refresh keeps the previous card until the next tick.
      }
      $.ui.invalidate('ui.render')
    })
    return next(e)
  })

  // Runs when you type /feed — open the pane with the keyboard; Esc closes it.
  on('command.run', { command: 'feed' }, async ($) => {
    await $.ui.open({ id: PANE, title: 'WaitFeed — feed', focus: true, closeOnEscape: true })
    // A fresh open starts the cursor on the first UPCOMING row again; the
    // autoFocus'ed row will raise ui.focus onto it anyway once it lands.
    ringKey = 'up-0'
    rowKeys = []
    // Print nothing in the transcript — the pane IS the response.
    return {}
  })

  // Runs when you press ctrl+n (the /waitfeed command): flip the card's own
  // show/hide and redraw the band. Nothing prints, no file changes — the same
  // instant, reversible toggle OpenCode's ctrl+o gives, on the one key.
  on('command.run', { command: 'waitfeed' }, async ($) => {
    cardHidden = !cardHidden
    $.ui.invalidate('ui.render')
    return {}
  })

  // The band above the prompt: the rotating news card, while the agent works.
  // Claude Code fires `ui.render` for the band on every redraw and on our own
  // `$.ui.invalidate` (the 20 s dwell tick, or ctrl+n). Four switches can take
  // the card and we pass on each: the engine's own survey (`hasSurvey`), a
  // band the person collapsed (`isCollapsed` — the host's ctrl+x ctrl+a, which
  // a mod can neither read nor undo), our own ctrl+n toggle (`cardHidden`),
  // and the shared `newsMode === 'hide'`. Otherwise the card rides the model
  // turn itself (`isWorking`), never the old activity ledger.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isCollapsed) return next(e)
    if (cardHidden) return next(e)
    if (!e.props.isWorking) return next(e)
    if (newsModeOf(newsConfig) === 'hide') return next(e)
    const list = visibleItems(cacheItems, newsConfig)
    if (list.length === 0) return next(e)
    const it = list[((cursor % list.length) + list.length) % list.length]
    if (!it) return next(e)

    const { Box, Text, Link } = $.ui.resolve(e)
    const hue = CHANNEL_COLOR[it.source]
    const badge = BAR + ' [' + (it.source || 'RSS') + '] '
    const title = String(it.title || it.id || '').replace(/\s+/g, ' ').trim()
    const meta = tickerMeta(it)
    // ONE wrapping paragraph — badge (channel hue), clean title, muted meta —
    // so a long headline wraps instead of truncating, exactly like the card
    // the other hosts draw. The meta rides inline here; the band wraps, so
    // there is no right edge to justify against.
    const children = [
      Text({
        children: [
          Text(hue ? { children: [badge], color: hue } : { children: [badge] }),
          Text({ children: [title] }),
          Text({ children: meta ? '  ' + meta : '', dimColor: true }),
        ],
      }),
    ]
    const desc = descTextOf(it, e.props.bodyColumns)
    if (desc) children.push(Text({ children: [desc], dimColor: true }))
    const url = typeof it.url === 'string' ? it.url.trim() : ''
    if (url) {
      // A real terminal hyperlink, not a Button: a band Button only fires its
      // onPress while the band holds keyboard focus (or with a hotkey/action
      // binding), so a click fell through to the terminal and it read the bare
      // "www." label as a file path instead of opening the browser. Link draws
      // the label as an OSC 8 hyperlink the terminal opens, and keeps the
      // origin row to one clean line. (The reader pane keeps its own Button +
      // openLink path, so openLink stays in use.)
      children.push(Link({ href: url, label: LINK_MARKER + linkTextOf(url) }))
    }
    // Keep the card tight against the prompt input: zero bottom padding,
    // margin, and gap of our own; one row of breathing room above the card.
    return Box({ flexDirection: 'column', marginTop: 1, paddingBottom: 0, marginBottom: 0, gap: 0, children })
  })

  // The pane: one pressable row per headline, its description under it.
  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    // Leave other mods' panes alone.
    if (e.requestId !== PANE) return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    const redraw = () => $.ui.invalidate('ui.render')
    // The cursor list's draw order refills at every render of THIS pane;
    // renders of other panes never reach past the guard above.
    rowKeys = []
    const groups = groupItems(cacheItems)
    // The hint bar leads the pane: the keys that work here, in one line.
    const children = [
      Text({
        children: ['↑/↓ move · Enter open · Esc close'],
        dimColor: true,
      }),
      Text({
        children: ['WaitFeed — seen ' + groups.seen.length + ' · new ' + groups.upcoming.length],
        dimColor: true,
      }),
      Text({ children: [' '] }),
    ]
    if (cacheItems.length === 0) {
      children.push(
        Text({
          children: ['The shared cache has no news yet — the next fetch cycle fills this pane.'],
          dimColor: true,
        }),
      )
      return Box({ flexDirection: 'column', children })
    }

    /** Rows of buttons: the docs' own list pattern — a press anywhere on the
     * row counts as one press. Keys are index-tagged: a Button key may hold
     * letters, digits, `_` and `-` only, and a URL would break that. Each
     * row is ONE line (no description under it — that lives in the cache),
     * so a cursor step and a scrolled row are the same unit everywhere. */
    const rows = (items, tag, focusRow) => {
      const out = []
      items.slice(0, PANE_MAX_ROWS).forEach((it, i) => {
        rowKeys.push(tag + '-' + i)
        const unread = !seen.read[itemKeyOf(it)]
        const rowChildren = [
          Text({ children: ['[' + (it.source || 'RSS') + ']'], dimColor: true }),
          Text({ children: [' ' + (it.title || it.id)], bold: unread }),
        ]
        const meta = metaOf(it, true)
        if (meta) rowChildren.push(Text({ children: ['  ' + meta], dimColor: true }))
        out.push(
          Button({
            key: tag + '-' + i,
            // The docs' focus prop (accepts only `true`): the first UPCOMING
            // row takes it so the pane opens with a visible highlighted row;
            // every other control omits it.
            ...(focusRow && i === 0 ? { autoFocus: true } : {}),
            children: rowChildren,
            onPress: async () => {
              await markRead($, it)
              redraw()
              try {
                await openLink($, it.url || '')
                await $.ui.toast('Opened · marked read')
              } catch {
                await $.ui.toast('The link could not be opened')
              }
            },
          }),
        )
      })
      return out
    }

    // UPCOMING first — the news you have not read is the news you came for.
    children.push(
      Text({ children: ['UPCOMING — new to you (' + groups.upcoming.length + ')'], bold: true }),
      ...rows(groups.upcoming, 'up', true),
      Text({ children: [' '] }),
      Text({ children: ['SEEN — already brought to you (' + groups.seen.length + ')'], bold: true }),
      ...rows(groups.seen, 'sn'),
    )
    return Box({ flexDirection: 'column', children })
  })

  // Where the ring is: the cursor reads it before each step. autoFocus on
  // the first UPCOMING row raises this on open, Tab lands here, a click
  // lands here. Our own $.ui.focus moves re-enter beneath this hook, so
  // recording never loops.
  on('ui.focus', { requestId: 'waitfeed' }, async ($, e, next) => {
    if (e.component === 'Pane' && e.element) {
      ringKey = e.element
    }
    return next(e)
  }).catch(async ($, e, next) => next(e)) // a thrown record lets the ring move

  // The sticky-cursor translation — the heart of the pane. An arrow (by
  // ±1, no pointer) or a wheel tick (by ±1 or a crowded sum, pointer set)
  // over the pane becomes ONE cursor step: the ring moves onto the next
  // pressable row and the window slides FOR the cursor, only the least
  // amount that keeps it visible ('nearest' does not move when it already
  // shows). PageUp/PageDown/Home/End ride next(e) — their window keeping
  // the docs' job. Our own reveal scrolls re-enter beneath this hook; a
  // deny (this site does not hold the keyboard) fails soft to next(e).
  on('ui.scroll', { requestId: 'waitfeed' }, async ($, e, next) => {
    if (e.component !== 'Pane') return next(e)
    // The moves this hook itself calls for ride next — the loop breaker.
    if (e.origin.kind === 'plugin') return next(e)
    // A page or a jump of rows keeps scrolling the window: documented.
    if (!e.pointer && Math.abs(e.by) > 1) return next(e)
    const dir = e.by > 0 ? 1 : -1
    const key = neighborRowKey(dir)
    // At either list edge: keep the window, move nothing.
    if (!key) return {}
    const move = await $.ui.focus({ requestId: PANE, key: key })
    if (move && move.deny) return next(e)
    ringKey = key
    await $.ui.scroll({ to: { key: key }, block: 'nearest' })
    return {}
  }).catch(async ($, e, next) => next(e)) // a thrown steer scrolls as the host would
}
