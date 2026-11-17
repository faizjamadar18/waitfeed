<!--
Keep PRs small and focused. One change per PR review fastest.
See CONTRIBUTING.md for the working agreements.
-->

## What and why

<!-- What does this change, and what problem does it solve? -->

Closes #

## Type

- [ ] Bug fix
- [ ] Feature
- [ ] Refactor (no behavior change)
- [ ] Docs / tooling / CI

## Checklist

- [ ] Small and focused — it does one thing
- [ ] Behavior change came with a failing test first (Red → Green)
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] No secrets, keys, or `.env` — WaitFeed is keyless by design
- [ ] No user keystrokes are swallowed and the adapter stays observational
- [ ] Docs updated if the config surface or host behavior changed
