// WaitFeed core types — shared by feeds, ticker, and the TUI plugin.
export interface FeedItem {
  /** Stable dedupe key, prefixed with channel, e.g. "hn-38219371". */
  id: string
  /** Short badge shown on the line, e.g. "HN", "DEV", "GH", "R/PROG". */
  source: string
  title: string
  url: string
  /** One-sentence context under the headline: channel description, page meta
   * description, or an LLM one-liner. Optional — the line renders without it. */
  context?: string
  /** Epoch ms, when known. */
  time?: number
  /** Points / stars / score, when known. */
  score?: number
}
