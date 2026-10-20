// WaitFeed enrichment — give headlines a one-line context when the channel
// doesn't provide one (Hacker News and Reddit link posts don't).
// Reads ONLY the linked page's meta description, like a link-preview does.
import type { FeedItem } from "./types"
import { decodeEntities, isContextDuplicate, truncateSentence } from "./ticker"

const TIMEOUT_MS = 8_000
/** Page visits are the only real cost in the pipeline — hard cap per cycle. */
const MAX_PER_CYCLE = 24
/** A batch opens a few pages at a time so the caller can stop the moment
 * enough usable items exist instead of always spending the whole cap. */
const BATCH = 8
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
      if (clean.length >= 15) return truncateSentence(clean, MAX_CONTEXT)
    }
  }
  return undefined
}

export interface EnrichOptions {
  /** Hard page-visit budget for this cycle (defaults to MAX_PER_CYCLE). */
  maxFetch?: number
  /** "Usable-article slots still open" check, evaluated between batches —
   * the stop-at-target rule: once enough items are ready, no more pages
   * open at all. Omit to always run up to maxFetch (old behavior). */
  slotsLeft?: () => number
}

/**
 * Fill `it.context` for items that lack one, by fetching the linked page's
 * meta description. Mutates items in place. Discussion/reddit pages carry no
 * useful story meta (and reddit 403s bot fetches), so they are skipped.
 * Runs in small batches and stops early the moment the caller's target is
 * met — deeper look-through lists must never turn into extra page visits.
 * Returns how many got context.
 */
export async function enrichMissing(items: FeedItem[], opts: EnrichOptions = {}): Promise<number> {
  const maxFetch = opts.maxFetch ?? MAX_PER_CYCLE
  const targets = items
    .filter((it) => !it.context && !/news\.ycombinator\.com|reddit\.com/.test(it.url))
    .slice(0, maxFetch)
  let filled = 0
  for (let start = 0; start < targets.length; start += BATCH) {
    // Stop-at-target check runs between batches: fewer visits, same coverage.
    if (opts.slotsLeft && opts.slotsLeft() <= 0) break
    const batch = targets.slice(start, start + BATCH)
    const filledOne = await Promise.all(
      batch.map(async (it): Promise<boolean> => {
        try {
          const res = await fetch(it.url, {
            headers: { "User-Agent": UA, Accept: "text/html" },
            signal: AbortSignal.timeout(TIMEOUT_MS),
          })
          if (!res.ok) return false
          const type = res.headers.get("content-type") ?? ""
          if (!type.includes("html")) return false
          const html = (await res.text()).slice(0, 300_000)
          const desc = extractMetaDescription(html)
          if (desc && !isContextDuplicate(it.title, desc)) {
            it.context = desc
            return true
          }
          return false
        } catch {
          // unreachable / timeout: the item simply renders without context
          return false
        }
      }),
    )
    filled += filledOne.filter(Boolean).length
  }
  return filled
}
