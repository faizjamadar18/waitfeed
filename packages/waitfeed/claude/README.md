# WaitFeed — Claude Code Adapter

> While your Claude Code agent works: a slim news card in the statusline row —
> keyless, local, observational, quiet when idle.

## What it renders

The `statusLine` command reads the same shared cache as every other WaitFeed
host (`~/.config/waitfeed/cache.json`) and prints the dwell-correct news card
in the proven AGY layout:

```
▍ [HN] Alpha headline                      ▲ 120 · 2h
Clean fed description snippet, wrapped.    ← ≤3 rows, from the fed data
github.com/…/the-story                     ← OSC 8 link: ctrl+click opens it
```

- Headline mode only (fed data; no LLM stories — the project bans API keys).
- The card advances on wall-clock dwell (20s default), persisted in
  `claude-rotation.json` — redraws inside one dwell window show the same card.

## Fitting the host field (no cut-offs)

Claude Code renders the statusline in a field narrower than the `COLUMNS` it
exports (~3 columns of right inset) and truncates overflow with `…`
(anthropics/claude-code#81454, #69967). The runner therefore right-justifies
every row to `COLUMNS − 4` (the same reserve ccstatusline ships) and wraps
long headlines across lines instead of truncating: no headline, metadata,
score, or time indicator is ever cut off at the corner.

## Busy/idle (AGY parity)

The statusline payload carries no busy flag, so an activity ledger
(`claude-activity.json`, per Claude session) decides when the card shows —
driven entirely by official hooks:

| Event | Flags | Meaning |
| --- | --- | --- |
| `UserPromptSubmit`, `PostToolUse`, `PostToolUseFailure` | `--heartbeat` (async) | the session is actively working |
| `SessionStart` | `--idle` | quiet on the splash screen |
| `Stop`, `StopFailure`, `SessionEnd` | `--idle` | the turn/session ended |
| `PermissionRequest` | `--idle` (async) | the agent waits on the user — not executing |
| `PreToolUse` (`AskUserQuestion` matcher) | `--idle` (async) | the question tool is asking the user |
| `Notification` (`elicitation_dialog`, `elicitation_url_dialog`) | `--idle` (async) | MCP elicitation is waiting on the user |
| `PermissionDenied` | `--heartbeat` (async) | denied → control returns to the agent |
| `Notification` (`idle_prompt` matcher) | `--idle` (async) | bounded quiet after a paused/idle stretch |
| `SessionStart` | `--watch` | seeds the transcript watcher (`watchPaths` — the instant Esc path) |
| `FileChanged` | `--interrupt-check` (async) | any transcript write; an Esc-interrupt write quiets + flips instantly |

No hook fires when the user presses **Esc** to interrupt a turn (Stop skips
interrupts, StopFailure is API-errors only), but the transcript records the
interrupt (`[Request interrupted by user]` as the newest turn event), so the
hide works in three layers:

1. **Instant:** the `SessionStart` hook returns `watchPaths` naming its
   transcript — Claude Code's filesystem watcher then fires `FileChanged`
   the moment the interrupt-marker write lands, no matter what wrote it.
   The hook checks the ledger + transcript tail: busy + interrupted → idle
   mark + instant-paint flip, all within milliseconds of the Esc press.
2. **Self-heal:** the statusline runs the same check on every refresh tick
   while the ledger says busy — the belt for sessions whose watcher is cold
   (no `SessionStart` seed yet) — and also writes the idle mark itself.
3. **Fast typist:** a heartbeat that hits Enter before either layer healed
   the ledger verifies the suspicious busy mark against the transcript
   first (a stale interrupt is a "lie") and still counts the Enter as a
   real transition — so the re-Enter card paints instantly too.

Rules: sessions are independent (two Claude windows never wake each other
up), a busy mark goes stale after 15 minutes (a crashed session can never pin
the card), and every REAL busy↔idle transition repaints INSTANTLY: the hook
first marks the ledger, then flips the stored statusline command between two
behavior-identical variants (a trailing ` --wf`) — Claude Code re-runs the
statusline the moment the command changes in settings.json, skipping its
300 ms update debounce, so Enter→card, question→hide, and answer→card all
land within a few hundred milliseconds instead of at the next refresh tick.
The 2-second `refreshInterval` remains as the safety net. The hook writes
only the `statusLine.command` string (read-modify-write of settings.json),
the suffix is inert for rendering, and a re-run of init accepts either
variant. A missing ledger (pre-ledger install) falls back to the legacy
always-busy panel so the news keeps working without a re-run of init.

## Install & migration

`npx waitfeed init` stages the self-contained bundles into `~/.claude/waitfeed/`
and writes `statusLine` + the hook set into `~/.claude/settings.json`
(idempotent — re-running never duplicates entries).

**Upgrading from v1.2-era installs:** re-run `npx waitfeed init` once to
receive the full hook set, `refreshInterval`, and the quiet-when-idle
behavior. Without the re-run the panel keeps working in legacy
always-on mode.

## Development

- Source: `claude/src/` — `statusline.ts` (runner glue), `statusline-state.ts`
  (pure parse/width/busy decisions), `activity.ts` (ledger),
  `flip.ts` (instant-paint command flip), `interrupt.ts` (Esc-interrupt
  detector), `watch.ts` (transcript-watcher seed), `scheduler.ts`
  (`--cycle` fetch pipeline + `--heartbeat`/`--idle` ledger writers +
  `--watch`/`--interrupt-check` instant-Esc modes),
  `stdin.ts` (shared stdin collector).
- Build: `npm run build:claude` from the repo root bundles into
  `claude/dist/*.mjs` (self-contained; the staged directory needs no
  node_modules beside it).
- Tests: `tests/claude.test.ts` (pure logic), `tests/claude-bundle.test.ts`
  (E2E via plain Node), `tests/cli.test.ts` (init/idempotency).

The adapter is strictly observational: it never modifies prompts, tools, or
agent behavior, prints nothing when idle, and every entry point exits 0.
