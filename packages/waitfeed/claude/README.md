# WaitFeed — Claude Code Adapter

> The news card now lives in the mod's band above the prompt
> ([`../claude-mod/README.md`](../claude-mod/README.md)); this directory is the
> keyless data cycle that keeps the shared cache fresh.

## What runs here

A single `SessionStart` hook runs one fetch → enrich → cache cycle in HEADLINE
MODE (`node ~/.claude/waitfeed/dist/scheduler.mjs --cycle`), then exits. That
is the whole adapter:

- It reads the same shared config (`~/.config/waitfeed/config.json`) and
  writes the same shared cache (`~/.config/waitfeed/cache.json`) as every
  other WaitFeed host. When OpenCode or AGY are installed too, the pipeline's
  cycle lock serializes the hosts safely.
- Headline mode only: Claude Code provides no free LLM API for plugins and the
  project bans API keys, so the pipeline pins headline mode.
- Observational and fail-open: it prints nothing, always exits `0`, and a
  failed cycle never surfaces as a hook failure.

The card itself is drawn by the mod (`claude-mod/`), which reads that cache
and gates on the host's own `isWorking`. There is no statusline bundle, no
per-session activity ledger, and no settings flip any more — older releases
painted the statusline through those, and init still prunes their leftovers
(see **Install & migration**).

## Busy / idle

Nothing here decides busy/idle. The band renders only while a model turn is
running (`e.props.isWorking` inside the mod) and draws nothing at idle, on the
splash screen, or while the agent waits on a question or a permission —
Claude's own state carries all of that. The shared `newsMode` switch can still
force the card off mid-run.

## Show / hide on demand

- **`Ctrl+N`** in the chat folds the band and hides just the card — the host's
  own `abovePrompt:toggle` action, which `npx waitfeed init` binds in the
  `Chat` context (`~/.claude/keybindings.json`). The host default
  `Ctrl+X Ctrl+A` does the same with no binding at all. Both are instant and
  write no file.
- **`npx waitfeed hide` / `show` / `toggle`** writes the shared `newsMode`
  from any shell, exactly like the other hosts: `hide` keeps the card off even
  mid-run, `auto` is the busy-only rule above.
- A key the user already bound to something else is never clobbered.

## Install & migration

`npx waitfeed init` stages the self-contained scheduler bundle into
`~/.claude/waitfeed/dist/`, the mod into `~/.claude/waitfeed/claude-mod/`, and
writes the `SessionStart` cycle hook plus the `env.CLAUDE_CODE_PLUGIN_DIRS`
entry into `~/.claude/settings.json` (idempotent — re-running never
duplicates). It also binds `Ctrl+N`.

**Upgrading from a statusline-era install:** re-run `npx waitfeed init` once.
Init prunes its own leftovers first — the old `statusLine` whose command
points into the staged dir, and every hook group of ours that is not the data
cycle — leaving foreign status lines and hooks untouched. Removal (`npx
waitfeed remove`) recognises the same legacy entries.

## Development

- Source: `claude/src/scheduler.ts` — the `--cycle` runner and its pipeline
  deps. There is nothing else here: the card and the reader live in
  `claude-mod/hooks/register.js`.
- Build: `npm run build:claude` from the repo root bundles into
  `claude/dist/scheduler.mjs` (self-contained; the staged directory needs no
  node_modules beside it).
- Tests: `tests/claude-bundle.test.ts` (E2E via plain Node),
  `tests/claude-mod.test.ts` (band + pane source contract),
  `tests/cli.test.ts` (staging, pruning, idempotency).

The adapter is strictly observational: it never modifies prompts, tools, or
agent behavior, prints nothing, and every entry point exits 0.
