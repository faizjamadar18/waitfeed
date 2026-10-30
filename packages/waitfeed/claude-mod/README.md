# WaitFeed — Claude Code Mod (the `/news` pane + prompt-band ticker)

> While your Claude Code agent works: the rotating news card in the band
> above the prompt; `/news` opens a pane of pressable headlines — a press
> opens the link and marks the row read. Keyless, local, observational.

This directory is a Claude Code **mod**: a plugin whose hooks module draws
in the interface. `npx waitfeed init` stages it into
`~/.claude/waitfeed/claude-mod/` and points `env.CLAUDE_CODE_PLUGIN_DIRS`
in `~/.claude/settings.json` at it — the env-var route the mods docs list
for launches where a `--plugin-dir` flag is impossible (`;`-separated on
Windows). `npx waitfeed remove` takes both back out; foreign plugin dirs
survive.

## What it draws

| Render site | What |
| --- | --- |
| `AbovePrompt` band | The dwell-correct rotating card — badge, headline, `▲ score · age`, description — **only while the agent executes** (`e.props.isWorking`). Idle it draws nothing (`next(e)`) — the shared quiet-at-idle rule. |
| `/news` pane | Opened by the `news` command (`immediate: true` lets it open mid-turn; `focus: true` + `closeOnEscape: true`). A dim hint bar leads it — `↑/↓ move · Enter open · Esc close` — and it opens with the **first UPCOMING row focused** (the docs' focus prop, set only there; the VS Code extension draws as without). One **single line per headline** (`[src] Title · ▲ score · 2h  read 3m` — the description stays in the cache); `UPCOMING — new to you` first, then `SEEN — already brought to you`. Pressing a row opens the link and marks it read: Windows via `rundll32 url.dll,FileProtocolHandler` (single program, args verbatim) with `start /c` as the fallback; macOS `open` → Linux `xdg-open`. |

Both sites render FROM the shared data; nothing here fetches.

## The sticky-cursor pane (how the keys behave)

The pane is a **sticky-cursor list** — the vim/fzf/IRC-log contract: the
cursor never leaves view; the window content slips under it one row, only
when it would cross an edge. Content follows the cursor, never the other
way round. Built on the mods events in the build's type declarations
(`claude-code.d.ts`, the 2.1.277 copy — re-verify on your build with
`/plugin-types` after updates):

- **↑ / ↓** inside the pane **move the cursor** one pressable row, across
  both piles (the row the ring sits on draws inverted). Every step re-
  reveals the ring with `$.ui.scroll({ block: 'nearest' })`, so the window
  slides exactly when the cursor reaches its edge — never earlier.
- **The wheel** inside the pane moves the cursor too — this reader has no
  content scrolling; "moves summed in flight" break to at most one step
  per event burst.
- **Enter** opens the focused row's link and marks it read; **Esc** closes
  the pane. **Tab** also walks rows, and mouse clicks work in fullscreen
  rendering — all host-native.
- **PageUp / PageDown / Home / End keep scrolling the window** — the one
  documented scroll path left to them; the translator passes them through.
- At either list edge the extra press is a no-op. A refresh that reshapes
  the piles may reseat the cursor to the first drawn row.
- Fail-soft everywhere: a denied ring move or a thrown hook falls back to
  `next(e)` — the host's own scroll — via `.catch` on both gating hooks.

A mod cannot bind Tab or the arrow keys (`interface.md`: "A mod can't bind
Tab or the arrow keys to anything else") — no key is intercepted here;
`ui.scroll` is consumed **per the hook contract** ("a hook kept the
window") and re-expressed as cursor moves.

## Data rules (host parity)

- The card and the pane read `~/.config/waitfeed/cache.json` — the same
  fetch → enrich → junk-drop → cache pipeline the OpenCode plugin and the
  statusline scheduler run. The band's 20 s dwell timer re-reads the file
  and advances the card; `$.ui.invalidate('ui.render')` asks for redraws.
- The seen ledger is the SHARED `~/.config/waitfeed/reader-state.json`
  (`{ read, glanced }`, key = `url || id`, trimmed + lowercased; marks age
  out at 36 h with the cache window). One mark of either kind puts an item
  in SEEN, so the piles match across hosts.
- Honesty of marks: `read` = you pressed the row (its time is the row's
  only label); `glanced` = a dwell on a ticker — written by hosts that
  record it, never claimed by a press here.
- `$.fs.write` is not atomic (mods docs). The OpenCode TUI owns the atomic
  write path; this mod re-reads the ledger immediately before writing —
  the docs' own advice for values several sessions change — so a
  concurrent mark survives and a race loses at most one mark.

## Version gate

Needs Claude Code **v2.1.295 or later** (rows of buttons with children).
Verified 2026-10-29 on 2.1.311 against the mods docs fetched the same day
(`create.md`, `interface.md`, `api.md`, `reference.md`). The hooks module
obeys every static-analysis rule: string-literal event names, `$` calls in
full, `$` passed only to top-level functions of the same file, and no
module paths at all — file/env/process/clock access goes through the mods
API because a hooks module has no Node.js APIs of its own.

## Development

- Validate: `claude plugin validate packages/waitfeed/claude-mod`
- Try without staging: `claude --plugin-dir packages/waitfeed/claude-mod`
- After a session opened the pane once, it reopens from 110 columns; before
  that a mod-opened pane wants 144. Opening it from `/news` always works.
- Tests: `tests/claude-mod.test.ts` (source contract), the `claude` blocks
  in `tests/cli.test.ts` (staging + removal). Run the full suite from the
  repo root: `npx vitest run`.

The mod is strictly observational: it draws, and it never touches prompts,
tools, or agent behavior.
