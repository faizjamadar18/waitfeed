# WaitFeed

> While your OpenCode agent works, a slim news ticker appears above the input box.
> You start typing — it vanishes. `/news` opens the fullscreen reader.
> **100% local. No ads, no accounts, no server, no API keys.**

## Install

Run the interactive setup wizard:

```bash
npx waitfeed init
```

Or manually add `waitfeed` to `plugins` in your `opencode.json(c)`:

```jsonc
{
  "plugins": ["waitfeed"]
}
```

Full docs: the package README at
[`packages/waitfeed/README.md`](packages/waitfeed/README.md),
also shown on [npm](https://www.npmjs.com/package/waitfeed).

## Repo layout

- `packages/waitfeed/` — the official `waitfeed` npm package (CLI, OpenCode plugin, Antigravity adapter).
- `frontend/` — the Next.js marketing landing page.
- `tests/` — unit & integration tests covering CLI, AGY, feed pipeline, and package safety.
- `scripts/probe-feeds.mjs` — channel health probe.
- Root `package.json` is the monorepo dev harness (`waitfeed-dev`).

## Development

```
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run preview     # show exactly what npm would publish
```

See [AGENTS.md](AGENTS.md) for build details and the master plan link.

## Independent project

WaitFeed is an independent open-source project and is not affiliated with OpenCode.
It uses OpenCode's public plugin API.

## License

MIT.
