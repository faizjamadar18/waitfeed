# WaitFeed

> While your agent works, a slim news ticker appears above the prompt or in
> the statusline.
> You start typing — it vanishes. `/news` opens the fullscreen reader.
> **No ads. No accounts. No server. No API keys.**

Every card is real news — a headline, a short blurb from the fetched data,
and the origin link underneath. Nothing is invented, and a dead channel
never empties the rotation — recent items are carried over for 36 hours.

## Hosts

One package, three terminal AI coding agents:

- **[OpenCode](https://opencode.ai)** — the original home: the ticker lives
  above the prompt, `/news` opens the fullscreen reader, and each card gets
  a short story written **only** from the fetched description (never
  invented) by your own session's model. The story pool holds 60 ready
  cards so the ticker never loops the same handful.
- **[Claude Code](https://claude.com/claude-code)** — the same card in the
  statusline row: instant on Enter, gone the moment you press **Esc** or the
  agent waits on you, quiet on the splash screen. Headline mode (the feed's
  own description — this host has no keyless LLM path); full behavior in
  [`claude/README.md`](claude/README.md).
- **Google Antigravity (AGY)** — the same card in the agent statusline,
  shown while the agent is working (`working`/`tool_use`/`reviewing`) and
  quiet on the splash screen and idle states.

All three share one data dir (`~/.config/waitfeed/`): one shared fetch
pipeline feeds every agent on the machine (a cycle lock serializes hosts),
and a channel you disable anywhere is disabled everywhere.

## Install

Run the interactive setup wizard — it detects which of the three agents are
installed and wires each one (idempotent — re-running never duplicates):

```bash
npx waitfeed init
```

To configure OpenCode by hand, add `waitfeed` to `plugins` in your
`opencode.json(c)`:

```jsonc
{
  "plugins": ["waitfeed"]
}
```

## Use

**OpenCode**

- **During a run**, the ticker rotates story cards while the agent works.
- **`/news`** opens the reader: up/down (or j/k) move, **Enter** opens the
  selected link, keys **1–4** toggle channels (Hacker News · dev.to ·
  GitHub trending · Reddit r/programming), **esc** closes.
- Channel switches save instantly to `~/.config/waitfeed/config.json`; a
  disabled channel is not even contacted by the next fetch cycle.
- Add your own RSS/Atom URLs in the same file (`"rssUrls": [...]`, max 10) —
  they always run and show with an `RSS` badge.

**Claude Code** (full behavior in [`claude/README.md`](claude/README.md))

- The card appears in the statusline the moment you submit a prompt, and
  hides when the turn ends, when the agent waits on a question or a
  permission, or when you press **Esc** to interrupt.
- Every busy↔idle transition repaints **instantly** (a settings flip, not
  the refresh tick); Esc hides within milliseconds via the transcript
  watcher.
- Channels are shared with OpenCode; without it, toggle them by editing
  `~/.config/waitfeed/config.json`.

**Antigravity (AGY)**

- Start `agy` — the statusline ticker rotates while the agent works.
- Channels are shared with OpenCode, exactly as above.

## Configuration

`~/.config/waitfeed/config.json` (shared by every host):

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
  invisible instead of getting a padded look-alike (story cards — OpenCode).
- If the story layer is unavailable, OpenCode's whole view flips to
  plain-headline mode until the next cycle re-probes — the two looks are
  never mixed.
- Claude Code and Antigravity always render headline mode (headline +
  description + link): those hosts have no keyless LLM path, and the
  project bans API keys.
- First run: the ticker stays honestly empty for a few seconds until the
  first stories land.

## Requirements

- One or more of: **OpenCode** (v2 plugin API — npm plugin packages load via
  `plugins` in `opencode.json(c)`), **Claude Code** (statusLine + hooks), or
  **Google Antigravity** (`agy` statusline).
- Node 20+ (npm may warn about `@opentui/core` engine ranges — that is
  OpenCode's own TUI dependency and runs inside OpenCode's runtime;
  installation via `npm install` is not the intended use)

## Dependency notes

All runtime dependencies are pinned to **exact versions** — the tree this
package was developed, tested, and audit-cleared against. Bumps happen
deliberately, at release time.

Two things are inherited from the OpenCode adapter's chain
(`@opencode/plugin`) and are outside this package's control:

- A plain `npm install waitfeed` (or `npm ls`) can print `seroval`/`solid-js`
  advisories from inside the `@opencode/plugin` package's own dependency
  subtree. The ticker's usage path never invokes the deserialization APIs in
  question; it renders text nodes. The fix belongs upstream (OpenCode bumping
  its `solid-js`), and this package re-checks the audit at every release.
- The `@opencode/plugin` dependency chain pulls `undici@8` on consumer
  installs; waitfeed's own dev tree pins `undici` to the Node 20-compatible
  6.x via its root override (overrides cannot travel with a published
  package). Loading through OpenCode is verified at each release.

## License

MIT.
