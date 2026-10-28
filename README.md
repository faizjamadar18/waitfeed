# WaitFeed

> While your AI coding agent works, a slim news ticker appears in your
> terminal — above the prompt in **OpenCode**, in the **Claude Code** or
> **Google Antigravity** statusline.
> You start typing — it vanishes. `/news` opens a fullscreen reader.
> **100% local. No ads, no accounts, no server, no API keys.**

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
- **Claude Code** — the wizard writes the `statusLine` command and the hook
  set into `~/.claude/settings.json` (details:
  [`packages/waitfeed/claude/README.md`](packages/waitfeed/claude/README.md))
- **Antigravity** — the wizard stages the statusline bundles and plugin
  config for `agy`

## What it does

| Host | Where the card lives | The card | Reader |
| --- | --- | --- | --- |
| OpenCode | above the prompt | headline + story written *only* from the fetched description + origin link | `/news` fullscreen reader — j/k move, Enter opens the link, keys 1–4 toggle channels |
| Claude Code | statusline row | headline + feed description + origin link | channel toggles via `config.json` |
| Antigravity (AGY) | agent statusline | headline + feed description + origin link | channel toggles via `config.json` |

- **One data dir, every agent.** All adapters read the same
  `~/.config/waitfeed/cache.json`; one fetch pipeline feeds every agent on
  the machine, and a channel disabled anywhere is disabled everywhere.
- **Busy means news, idle means nothing.** The card shows only while the
  agent executes — instant on Enter, gone on turn end, Esc, or a
  wait-on-the-user. Two Claude windows never wake each other up.
- **Keyless by design.** Hacker News · dev.to · GitHub trending · Reddit
  r/programming, plus your own RSS/Atom feeds (`rssUrls` in
  `~/.config/waitfeed/config.json`, shown with an `RSS` badge). The
  OpenCode story cards are written by the user's own session model — no
  API, no key. Claude Code and Antigravity render headline mode: those
  hosts have no keyless LLM path, and the project bans API keys.

Configuration is deliberately small — one file, `~/.config/waitfeed/config.json`:

| Key | Default | Meaning |
| --- | --- | --- |
| `sources` | all on | per-channel switches: `hn`, `devto`, `github`, `reddit` |
| `rssUrls` | `[]` | your own RSS/Atom feeds (max 10; always run, `RSS` badge) |
| `dwellSeconds` | `20` | card hold time during a run (5–120s) |

**Honest limits:** items whose fetched description is too thin to write a
real story from stay invisible instead of getting a padded look-alike; if
OpenCode's story layer is unavailable, the whole view flips to
plain-headline mode — the two looks are never mixed; the first run stays
honestly empty for a few seconds until the first stories land.

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
     ├─ opencode/   OpenTUI Solid slot renders the cards; /news reader;
     │              stories generated in-session by the user's own model
     ├─ claude/     statusLine renders the card; official hooks feed a
     │              per-session activity ledger; a settings flip re-runs the
     │              statusline instantly on busy↔idle; a transcript watcher
     │              makes Esc-interrupts instant (Claude fires no hook then)
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
  opencode/ · claude/ · agy/       the three host adapters
  bin.mjs              `npx waitfeed init` onboarding wizard
tests/                 9 suites: unit + built-bundle E2E (plain Node spawns)
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
are to the feed URLs you keep enabled, once every 30 minutes. No telemetry,
no accounts, no server — the CLI talks only to feeds and your local hosts'
config.

WaitFeed is an independent open-source project and is not affiliated with
OpenCode, Anthropic, or Google. It uses OpenCode's public plugin API and
Claude Code's statusLine/hooks interface.

## License

MIT.
