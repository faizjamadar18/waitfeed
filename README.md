# WaitFeed

> While your AI coding agent works, a slim news ticker appears in your
> terminal — above the prompt in **OpenCode** and **Claude Code**, in the
> **Google Antigravity** statusline.
> It's gone the moment the agent stops — which is when you start typing.
> `/feed` opens a fullscreen reader.
> One key hides the card while the agent works (`Ctrl+O` in OpenCode,
> `Ctrl+N` in Claude Code; `npx waitfeed toggle` anywhere). **100% local.
> No ads, no accounts, no server, no API keys.**

## Why

Waiting on a coding agent is dead time you never chose — the terminal sits
there doing nothing while the work happens. WaitFeed makes every agent
wait count: a live news briefing in the exact place you're already
looking, on your terms. Real news while the agent executes, nothing when
it doesn't, and nothing ever leaves your machine.

## Quick start

```bash
npx waitfeed init
```

The wizard detects which of the three agents are installed and wires each
one — staging self-contained bundles and writing each host's config
(idempotent; re-running never duplicates). Prefer by hand?

- **OpenCode** — add `waitfeed` to `plugins` in your `opencode.json(c)`:
  ```jsonc
  { "plugins": ["waitfeed"] }
  ```
- **Claude Code** — the wizard stages the mod (the news card in the band
  above the prompt, plus the `/feed` reader) and the data-cycle hook, and
  binds `Ctrl+N` to hide the card (details:
  [`packages/waitfeed/claude/README.md`](packages/waitfeed/claude/README.md))
- **Antigravity** — the wizard stages the statusline bundles and plugin
  config for `agy`

## Uninstall

```bash
npx waitfeed remove
```

Removes the integration from every agent — the config entries and the
staged files — and then deletes `~/.config/waitfeed/` (the news cache and
your channel choices). Nothing of WaitFeed is left configured anywhere;
`npx waitfeed init` afterwards starts the onboarding fresh. `--keep-data`
keeps that folder instead. Plain `npm uninstall waitfeed` only removes the
npm package and never touches the agent integrations — that is what
`remove` is for. If you installed the package globally, finish with
`npm uninstall -g waitfeed`.

## What it does

| Host | Where the card lives | The card | Reader |
| --- | --- | --- | --- |
| OpenCode | above the prompt | headline + the feed's own description + origin link | `/feed` fullscreen reader — j/k move, Enter opens the link, keys 1–4 toggle channels |
| Claude Code | band above the prompt | headline + feed description + origin link | `/feed` pane — arrows move, Enter opens the link; channel toggles via `config.json` |
| Antigravity (AGY) | agent statusline | headline + feed description + origin link | channel toggles via `config.json` |

- **Show or hide it on demand.** While the agent works, one action flips the
  card: **`Ctrl+O`** in OpenCode, **`Ctrl+N`** in Claude Code, and
  **`npx waitfeed hide` / `show` / `toggle`** from any shell. Dismiss the
  ticker to focus on code — even mid-run — and bring it back. Nothing
  renders at idle on any host, so the terminal is your own between turns.
- **One data dir, every agent.** All adapters read the same
  `~/.config/waitfeed/cache.json`; one fetch pipeline feeds every agent on
  the machine, and a channel disabled anywhere is disabled everywhere.
- **Busy means news, idle means nothing.** The card shows only while the
  agent executes — instant on Enter, gone on turn end, Esc, or a
  wait-on-the-user. Two Claude windows never wake each other up.
- **Keyless by design.** Hacker News · dev.to · GitHub trending · Reddit
  r/programming, plus your own RSS/Atom feeds (`rssUrls` in
  `~/.config/waitfeed/config.json`, shown with an `RSS` badge). Every host
  renders the same card — the headline, the feed's own description, and the
  origin link. No API, no key, no LLM in the loop.

Configuration is deliberately small — one file, `~/.config/waitfeed/config.json`:

| Key | Default | Meaning |
| --- | --- | --- |
| `sources` | all on | per-channel switches: `hn`, `devto`, `github`, `reddit` |
| `rssUrls` | `[]` | your own RSS/Atom feeds (max 10; always run, `RSS` badge) |
| `dwellSeconds` | `20` | card hold time during a run (5–120s) |
| `newsMode` | `"auto"` | `"auto"` follows the agent, `"hide"` forces the card off even mid-run; `"show"` is a legacy alias of `"auto"`. Nothing renders at idle |
| `newsModes` | — | optional per-host overrides (`opencode`/`claude`/`agy`), written by `npx waitfeed hide <host>` |

**Honest limits:** items whose fetched description is too thin are dropped
rather than padded out with filler; a dead channel never empties the
rotation, since recent items are carried for 36 hours; the first run stays
honestly empty for a few seconds until the first fetch lands.

The full manual (per-host behavior, dependency notes) ships with the
package: [`packages/waitfeed/README.md`](packages/waitfeed/README.md), also
shown on [npm](https://www.npmjs.com/package/waitfeed).

## How it works

```
 Hacker News · dev.to · GitHub · Reddit · your RSS
     │  fetch → enrich → drop junk      (cycle lock serializes hosts)
     ▼
 ~/.config/waitfeed/cache.json        ◄── the only shared state
     │
     ├─ opencode/   OpenTUI Solid slot renders the cards; /feed reader
     ├─ claude/ · claude-mod/
     │              the mod draws the card in the band above the prompt
     │              (only while Claude works — the host's own isWorking) and
     │              the /feed reader pane; claude/ runs the data cycle
     └─ agy/        statusline renders the card from the agent_state JSON
```

Design decisions worth reading the code for:

- **Adapters are thin runners; decisions live in `core/`** — feed selection,
  junk filtering, dwell rotation, and card layout are host-agnostic modules
  with their own suites, so a new host adapter is glue only.
- **Every entry point is observational and fail-open** — hooks print
  nothing, exit 0, and never block; renders never crash the host terminal;
  a missing ledger falls back to legacy behavior rather than blank news.
- **Consumer-machine safety is test-enforced** — the "works in dev, breaks
  on install" bug class (JSX source resolution, homedir-anchored paths, no
  React imports) is pinned by `tests/package.test.ts`.

## Repository layout

```
packages/waitfeed/     the npm package — publish root (package.json, LICENSE)
  core/                host-agnostic pipeline & rendering decisions
  opencode/ · claude/ · claude-mod/ · agy/   the host adapters
  bin.mjs              `npx waitfeed init` onboarding wizard
tests/                 11 suites: unit + built-bundle E2E (plain Node spawns)
frontend/              the Next.js landing page (links here from hero & navbar)
scripts/               feed channel health probe
```

## Development

```bash
npm ci                                  # dev harness: tsc, vitest, esbuild
npm install --legacy-peer-deps          # in packages/waitfeed — the package's own tree
npm run typecheck                       # strict tsc over tests + packages
npm test                                # builds the adapter bundles, runs all suites
npm run preview                         # exactly what npm would publish
```

PRs welcome — keep them small; CI must stay green.

## Privacy

Everything lives locally in `~/.config/waitfeed/`. The only network calls
are to the feed URLs you keep enabled: a 30-minute baseline, plus an early
refill when you're down to your last few unread headlines (never more than
once a minute). No telemetry,
no accounts, no server — the CLI talks only to feeds and your local hosts'
config.

WaitFeed is an independent open-source project and is not affiliated with
OpenCode, Anthropic, or Google. It uses OpenCode's public plugin API and
Claude Code's mods/hooks interface.

## License

MIT.
