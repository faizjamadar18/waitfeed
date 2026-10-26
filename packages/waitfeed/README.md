# WaitFeed

> While your agent works, a slim news ticker appears above the input box.
> You start typing — it vanishes. `/news` opens the fullscreen reader.
> **No ads. No accounts. No server. No API keys.**

An [OpenCode](https://opencode.ai) plugin. Every card is real news — a headline,
a short story written **only** from the fetched description (never invented),
and the link underneath. The story pool is kept at 60 ready cards so the
ticker never loops the same handful, and a dead channel never empties it —
recent items are carried over for 36 hours.

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

## Use

- **During a run**, the ticker rotates story cards while the agent works.
- **`/news`** opens the reader: up/down (or j/k) move, **Enter** opens the
  selected link, keys **1–4** toggle channels (Hacker News · dev.to ·
  GitHub trending · Reddit r/programming), **esc** closes.
- Channel switches save instantly to `~/.config/waitfeed/config.json`; a
  disabled channel is not even contacted by the next fetch cycle.
- Add your own RSS/Atom URLs in the same file (`"rssUrls": [...]`, max 10) —
  they always run and show with an `RSS` badge.

## Configuration

`~/.config/waitfeed/config.json`:

| Key | Default | Meaning |
| --- | --- | --- |
| `sources` | all on | per-channel switches: `hn`, `devto`, `github`, `reddit` |
| `rssUrls` | `[]` | your own RSS/Atom feeds |
| `dwellSeconds` | `20` | card hold time during a run (5–120s) |
| `setupDone` | `false` | set by your first keypress inside the reader |

Data lives locally in `~/.config/waitfeed/`. The only network calls are to the
feed URLs you keep enabled, once every 30 minutes. Nothing else ever leaves
your machine.

## Honest limits

- Items whose fetched description is too thin to write a real story from stay
  invisible instead of getting a padded look-alike.
- If the story layer is unavailable, the whole view flips to plain-headline
  mode until the next cycle re-probes — the two looks are never mixed.
- First run: the ticker stays honestly empty for a few seconds until the
  first stories land.

## Requirements

- OpenCode, with the v2 plugin API (npm plugin packages load via
  `plugins` in `opencode.json(c)`)
- Node 20+ (npm may warn about `@opentui/core` engine ranges — that is
  OpenCode's own TUI dependency and runs inside OpenCode's runtime;
  installation via `npm install` is not the intended use)

## Dependency notes

All runtime dependencies are pinned to **exact versions** — the tree this
plugin was developed, tested, and audit-cleared against. Bumps happen
deliberately, at release time.

Two things are inherited from OpenCode's own packages and are outside this
plugin's control:

- A plain `npm install waitfeed` (or `npm ls`) can print `seroval`/`solid-js`
  advisories from inside the `@opencode/plugin` package's own dependency
  subtree. The ticker's usage path never invokes the deserialization APIs in
  question; it renders text nodes. The fix belongs upstream (OpenCode bumping
  its `solid-js`), and this plugin re-checks the audit at every release.
- The `@opencode/plugin` dependency chain pulls `undici@8` on consumer
  installs; waitfeed's own dev tree pins `undici` to the Node 20-compatible
  6.x via its root override (overrides cannot travel with a published
  package). Loading through OpenCode is verified at each release.

## License

MIT.
