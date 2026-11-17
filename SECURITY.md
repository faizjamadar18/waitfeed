# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:
[**Report a vulnerability**](../../security/advisories/new) on this
repository. That channel is visible only to the maintainer until a fix is
ready and a coordinated disclosure is agreed.

If you cannot use GitHub, open a minimal issue that says only that you have a
security report and would like a private channel — do not include details.

You can expect an initial response within a few days. Please include:

- what the issue is and how it can be triggered,
- the affected version(s) and host (OpenCode / Claude Code / Antigravity),
- a minimal reproduction if you have one.

## Supported versions

Fixes land on the latest published `1.x` release. Older versions are not
patched — upgrade to the newest `waitfeed`.

## Scope and design notes

WaitFeed is designed to be small and local, which keeps the attack surface
small:

- **No server, no accounts, no telemetry.** The CLI talks only to the feed
  URLs you enable and to your hosts' own config files.
- **No API keys or secrets**, so there is nothing to leak from a config file.
- **Fetched content is untrusted display data.** Headlines and descriptions
  are rendered as text. If you find a path where feed content is interpreted
  as a command, a path, or code rather than shown, that is a vulnerability —
  report it.
- **Write-through only where intended.** `npx waitfeed init` / `remove` edit
  host config files and the shared data dir at `~/.config/waitfeed/`. Paths
  must stay anchored there; anything that escapes that directory is a bug.

Reports about a third-party feed serving unwanted content are not security
issues — the news comes from live public sources you choose to enable.
