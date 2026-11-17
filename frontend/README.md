# WaitFeed — landing page

The public marketing site and documentation for
[WaitFeed](https://github.com/faizjamadar18/waitfeed), a news ticker for AI
coding agents. Built with Next.js (App Router), React, and Tailwind CSS v4.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run lint` | ESLint |

## Notes for contributors

- `AGENTS.md` is generated and re-added by `next dev` — **commit it**; removing
  it only recreates the uncommitted change on the next run.
- This project is not part of the published npm package. The package itself
  lives in [`../packages/waitfeed`](../packages/waitfeed); its README is the
  source of truth for install and configuration.
- Site content should match real host behavior. If you change a feature, check
  `src/data/docsData.ts` against the package README before shipping.

## Deploy

The site needs no environment variables. `npm run build` produces a standard
Next.js output that can be served by any Node host or edge platform.
