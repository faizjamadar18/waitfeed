# WaitFeed — Agent Instructions

> While the OpenCode agent works, a slim news ticker appears in the line above the
> input box. You start typing — it vanishes. `/news` opens a fullscreen reader.
> **100% local, no ads, no accounts, no server, no API keys.**

## What this is

An OpenCode TUI plugin (plus a tiny init CLI and a Next.js landing page later).
Inspired by distrotv.xyz (an ad exchange for agent wait time) — WaitFeed is the
deliberately opposite take: no ads, personal, OpenCode-native, zero backend.

- **Master build plan:** `C:\Users\faizj\.opencode\plan\waitfeed-build-plan.md` — read it before coding.
- **Plugin API docs (verify before using any API):** <https://opencode.ai/v2/docs/build/plugins> and <https://opencode.ai/v2/docs/build/plugins/cli>

## Tech stack

| Need | Choice |
|---|---|
| Language | TypeScript, strict |
| Runtime | Node 20+ |
| Plugin bindings | `@opencode/plugin` (server) + `@opencode/plugin/tui` (terminal UI) |
| TUI rendering | OpenTUI Solid components |
| HTTP | built-in `fetch` |
| Feeds | Hacker News API, dev.to API, GitHub search API, Reddit RSS, user-supplied RSS (`rss-parser`) — all keyless |
| Init CLI UI | `@clack/prompts` (M5) |
| Landing page | Next.js (M5) |

**Never add:** MongoDB, Redis, Python, a backend server, API keys, accounts, ads.

## How to develop

- The plugin lives at `.opencode/plugins/waitfeed/` and is auto-loaded when OpenCode runs in this repo. No config edits needed for local dev.
- Reload the plugin after changes: `opencode reload` (re-runs `setup` in the shared service). Prefer this over `opencode service restart`, which drops live sessions. TUI-side changes additionally need the user to close/reopen their OpenCode window.
- Known quirk: `opencode plugin list` exits 1 and does NOT re-run setup once the plugin has loaded before — not a bug in our plugin; verify loads via `opencode reload` + effects (marker/cache file), not via `plugin list`.
- The plugin's `package.json` pins `"overrides": { "undici": "6.29.1" }` — `@effect/platform-node` (via `@opencode/util`) pulls `undici@8`, which needs Node ≥22; OpenCode runs Node 20 and silently fails to load the plugin when top-level undici is v8. Do not remove the override when reinstalling deps (`npm install --legacy-peer-deps` in the plugin dir).
- LLM news stories use `ctx.session.generate({ sessionID, prompt })` on a
  dedicated "WaitFeed news digest" session whose ID persists in cache.json
  (`digestSessionID`) — this rides the user's own session pipeline, which the
  free tier **allows** (verified live 2026-10-17: real stories generated, no
  key). Stateless `ctx.generate.text` from plugin setup IS still refused on the
  free tier; on a gate refusal the cache gets `llmUnavailable: true` and the
  layer re-probes automatically on the next cycle.
- `ctx.session.list` does NOT exist on the plugin's session domain (docs mention
  it, the type doesn't) — clean up orphan digest sessions manually via
  `opencode api session.remove --param sessionID=ses_...`. Generation-path
  diagnostics live in `~/.config/waitfeed/probe.log`.
- The shared service re-runs plugin `setup` ONCE PER ACTIVE SESSION — one
  `opencode reload` produced three SETUP STARTs (own session, the open TUI
  session, and the WaitFeed digest session itself). Consequences handled:
  multiple interval timers (a stale-TTL `cycle.lock` file serializes expensive
  cycle work), digest-session adoption via `digestSessionID` in cache.json is
  race-safe, and each setup runs one tiny health probe.
- Data pipeline: the server plugin (`index.ts`) fetches → enriches → drops junk →
  writes `~/.config/waitfeed/cache.json` (first write right after the fetch so
  headline data lands fast), then generates LLM stories for up to 8 new items
  per cycle (newest first, soft time budget) with an incremental cache write
  after each; the TUI (`tui.tsx`) only polls that file (5 s) and never fetches
  feeds itself. The cycle re-reads the user config each cycle.
- User config (`core/config.ts`): `~/.config/waitfeed/config.json`, created
  with defaults on the first `/news` open. Keys 1-4 in the reader toggle
  channels (`sources`), persist instantly, and the server stops even
  contacting a disabled channel on its next cycle. Reader filtering = the same
  config (single source of truth) — disabled-channel cards vanish from the
  ticker immediately; RSS-badge items always show.
- Reader keys & layout: up/down (or j/k) move the cursor, enter opens the
  selected link (spawn `cmd /c start` on Windows, `open`/`xdg-open` otherwise),
  esc closes, f toggles fullscreen. The list renders ONE line per item
  (`ReaderRow`: marker + badge + truncated title + `▲ score` + age); only the
  selected row expands to show its story, and long URLs never render as text.
  Header-zone lines are single strings — a multi-node colored chips row once
  overprinted the line below it. The `↳` arrow is gone (junk glyphs on some
  terminals), replaced with plain `>`; other glyphs render safely: `▍ ▸ ▲ · …`.
- Display contract (one look, never mixed): while the LLM layer is healthy the
  TUI shows ONLY story-ready items (headline + story + link); when the cache
  reports `llmUnavailable` (gate refusal or repeated generation failure) the
  whole view switches to headline mode (headline + description + link) until
  the next fetch cycle resets and re-probes it.
- Feed descriptions are stored up to 600 chars (`CONTEXT_MAX` in
  `core/feeds.ts`) — the reader wraps what it gets; never re-truncate display
  text into shorter stored data.
- Gates before every handover:
  - `npx tsc --noEmit` — clean (0 errors)
  - `npx vitest run` — passes (from M1 onward; 53 tests since the
    package-integrity suite landed)
  - Zero IDE/Lint warnings — 0 warnings, standard utility classes (no unnecessary arbitrary Tailwind brackets), 0 unused imports.
- Consumer-machine safety rules (found the hard way via the 1.0.0 TUI load
  failure — "works in dev, breaks on install" bug class, guarded by
  `tests/package.test.ts`):
  - `tui.tsx` line 1 MUST stay `/* @jsxImportSource @opentui/solid */` — the
    file must self-describe its JSX source because consumer installs have no
    repo tsconfig above them; without the pragma OpenCode's transpiler
    defaults to React and the TUI half fails with `Cannot find package
    'react'`.
  - The plugin dir ships its own `tsconfig.json` (mirrors the repo root
    settings; listed in package.json `files`) — second safety net.
  - Never import React anywhere; never use `__dirname`, `process.cwd()` or
    hardcoded absolute paths in shipped files; every file access anchors to
    `join(homedir(), ".config", "waitfeed", ...)` so it works on any machine.
  - Slot-rendered rows (`NewsParagraph`, composer.top) must NEVER size from
    `process.stdout.columns` — the row spans `width="100%"` of its real
    parent box instead (OpenTUI Yoga resolves percentages against the
    parent), the headline is a `flexGrow` middle cell that wraps and is
    NEVER truncated, and badge-left/meta-right is justified by that growth
    (meta pinned at the corner even when the headline is huge). Pieces own
    their spacing; meta strings come from the pure `formatMeta()` helper.
    Guarded by the `ticker card layout` test in `tests/package.test.ts`.
- npm publishing facts (verified against npm docs 2026-10-21): the publish
  root is `.opencode/plugins/waitfeed/` (its package.json is the published
  `waitfeed` package; root package.json is the private `waitfeed-dev`
  harness). Runtime dependencies are EXACT-pinned — bump them deliberately
  per release, never silently. `overrides` do not travel with a published
  package (npm rule), so consumer installs resolve OpenCode's own chain
  (undici@8 + seroval advisories) — documented honestly in the package
  README; re-check `npm audit` and a tarball consumer-install at each
  release. `npm pack --dry-run` from the publish root previews the tarball;
  `package-lock.json` is always excluded from it.

## Milestones

M0 spike (slots, panel, hide mechanism) → M1 core ticker → M2 context lines
(junk filter, meta-description enrichment, one-glance LLM story ≤180 chars per
headline via the digest session, source link under each story)
→ M3 `/news` reader extras (Enter opens link, filters) → M5 ship (init CLI, npm
publish, landing page).

## Hard boundaries

1. **Never commit or push without the user's explicit YES.**
2. **No API keys, no secrets, no `.env` in this project — keyless by design.**
3. **Never swallow user keystrokes.** Hide-on-type must never intercept or eat input.
4. Stay observational: the plugin must not modify prompts, tools, or agent behavior.
5. Verify plugin APIs against the current V2 docs before use — the API is young.
6. Keep changes small and consistent; this repo will be public open source (MIT).
7. **Zero-warning standard practices:** Always fix all IDE/lint warnings, remove unused imports/variables, and use standard utility classes before handing over code.
