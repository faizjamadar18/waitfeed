// WaitFeed enrichment — give headlines a one-line context when the channel
// doesn't provide one (Hacker News and Reddit link posts don't).
// Reads ONLY the linked page's meta description, like a link-preview does.
import type { FeedItem } from "./types"
import { decodeEntities, isContextDuplicate } from "./ticker"

const TIMEOUT_MS = 8_000
const MAX_PER_CYCLE = 24
const MAX_CONTEXT = 240
const UA = "waitfeed/0.1 (local terminal ticker)"

function extractMetaDescription(html: string): string | undefined {
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']description["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      const clean = decodeEntities(m[1]).replace(/\s+/g, " ").trim()
      if (clean.length >= 15) return clean.slice(0, MAX_CONTEXT)
    }
  }
  return undefined
}

/**
 * Fill `it.context` for items that lack one, by fetching the linked page's
 * meta description. Mutates items in place. Discussion/reddit pages carry no
 * useful story meta (and reddit 403s bot fetches), so they are skipped.
 * Returns how many got context.
 */
export async function enrichMissing(items: FeedItem[], maxFetch = MAX_PER_CYCLE): Promise<number> {
  const targets = items
    .filter((it) => !it.context && !/news\.ycombinator\.com|reddit\.com/.test(it.url))
    .slice(0, maxFetch)
  let filled = 0
  await Promise.allSettled(
    targets.map(async (it) => {
      try {
        const res = await fetch(it.url, {
          headers: { "User-Agent": UA, Accept: "text/html" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!res.ok) return
        const type = res.headers.get("content-type") ?? ""
        if (!type.includes("html")) return
        const html = (await res.text()).slice(0, 300_000)
        const desc = extractMetaDescription(html)
        if (desc && !isContextDuplicate(it.title, desc)) {
          it.context = desc
          filled++
        }
      } catch {
        // unreachable / timeout: the item simply renders without context
      }
    }),
  )
  return filled
}
