# WaitFeed

> While your OpenCode agent works, a slim news/tip ticker appears above the input box.
> You start typing — it vanishes. `/news` opens a fullscreen reader.
> **100% local. No ads, no accounts, no server, no API keys.**

## Channels & personal tips

The reader is the setup: open `/news`, keys **1-4** switch channels on/off
(instantly saved to `~/.config/waitfeed/config.json`), **Enter** opens the
selected link, **up/down** (or **j/k**) moves the cursor. Every 4th ticker slot
is the `▍ YOU` card — tips computed **only** from local `git status` / `git log`
metadata in the open project. Never file contents, never network, never sent
anywhere.

## Data sources (all free, all keyless)

Hacker News · dev.to · GitHub trending · Reddit tech · any RSS/Atom URL you choose.

## Independent project

WaitFeed is an independent open-source project and is not affiliated with OpenCode.
It uses OpenCode's public plugin API.
