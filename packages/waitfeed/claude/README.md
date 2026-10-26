# WaitFeed — Claude Code Adapter

> WaitFeed integration for Anthropic Claude Code terminal agent.

## Status

**Releases in v1.2**

This directory houses the upcoming Claude Code wait-state hook adapter, following the same local-first, zero-backend architecture as the OpenCode and Antigravity integrations:

- Observational wait-state hook (activates only while Claude Code processes tool execution/thinking).
- Reads shared cached feeds from `~/.config/waitfeed/cache.json`.
- Zero latency impact, zero model tampering.
