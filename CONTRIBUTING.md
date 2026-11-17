# Contributing to WaitFeed

Thanks for wanting to help. WaitFeed is a small, deliberately scoped tool:
one shared local cache, three host adapters, zero keys. Keeping it that way
is the point — so most contributions are small, and PRs stay easy to review.

## Ground rules

- **Keep it small.** One change per pull request. A focused diff reviews in
  minutes; a broad one sits for weeks.
- **TDD for behavior changes.** Write the failing contract first, make it
  pass, keep the test. Bugs get a regression test that fails before the fix.
- **Zero warnings.** No unused imports or variables, no stray files, no
  debug output left behind.
- **Stay observational.** WaitFeed never modifies prompts, tools, or agent
  behavior, and never swallows a keystroke. Display code must never block or
  crash the host terminal.
- **Keyless by design.** No API keys, no secrets, no `.env`, ever.

Read [`AGENTS.md`](AGENTS.md) for the architecture and the hard-won gotchas
before touching the adapters — it will save you a debugging session.

## Getting set up

Requires Node 20+.

```bash
npm ci                            # dev harness: tsc, vitest, esbuild
cd packages/waitfeed              # the published package resolves its own tree
npm install --legacy-peer-deps    # the undici override needs this flag
cd ../..

npm run typecheck                 # strict tsc over tests + packages
npm test                          # builds the adapter bundles, runs every suite
npm run preview                   # exactly what npm would publish
```

The landing page lives in `frontend/` and is its own npm project:

```bash
npm run frontend:dev              # next dev
npm run frontend:lint
npm run frontend:build
```

## Where things live

```
packages/waitfeed/core/       host-agnostic decisions: feeds, enrich, junk
                              filter, cache pipeline, config, ticker rendering
packages/waitfeed/opencode/   OpenCode TUI plugin + /feed reader
packages/waitfeed/claude/     Claude Code data cycle
packages/waitfeed/claude-mod/ Claude Code band card + /feed pane
packages/waitfeed/agy/        Antigravity statusline
packages/waitfeed/bin.mjs     the `npx waitfeed` init/remove wizard
tests/                        vitest suites (unit + built-bundle E2E)
frontend/                     the Next.js landing page + docs
scripts/                      feed channel health probe
```

Decisions belong in `core/`; adapters are thin glue. If you find yourself
duplicating host-agnostic logic into an adapter, it belongs in `core/`
instead.

## Design one interaction past the literal ask

Before shipping UI, think through the conflicts it creates: what moves a
cursor whose natural keys are already bound, what the on-screen hint must
say, what overrides what at the edges. A shipped hint only promises what it
literally shows.

## Commits

Conventional Commits syntax (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`,
`refactor:`), imperative mood, scoped where it helps
(`feat(frontend): ...`). Keep the subject line meaningful.

## Reporting

- **Bugs and ideas** — use the [issue templates](../../issues/new/choose).
- **Security** — do not open a public issue; follow [`SECURITY.md`](SECURITY.md).

By participating you agree to the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
