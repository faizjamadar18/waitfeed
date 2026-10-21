# WaitFeed

> While your OpenCode agent works, a slim news ticker appears above the input box.
> You start typing — it vanishes. `/news` opens the fullscreen reader.
> **100% local. No ads, no accounts, no server, no API keys.**

## Install

Add to `plugins` in your `opencode.json(c)` and restart OpenCode:

```jsonc
{
  "plugins": ["waitfeed"]
}
```

Full docs: the package README at
[`.opencode/plugins/waitfeed/README.md`](.opencode/plugins/waitfeed/README.md),
also shown on [npm](https://www.npmjs.com/package/waitfeed).

## Repo layout

- `.opencode/plugins/waitfeed/` — the OpenCode plugin (server pipeline + TUI).
  This directory is the npm package `waitfeed`.
- `tests/` — unit tests for the plugin's pure core.
- `scripts/probe-feeds.mjs` — channel health probe.
- Root `package.json` is only the dev harness (typecheck + tests), named
  `waitfeed-dev` so it can never collide with the published package.

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
