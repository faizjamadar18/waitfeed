import type { FeedItem } from "./types"

/** HTTP scheme and host are case-insensitive; paths, queries, fragments and
 * opaque fallback IDs are not. Keep credentials verbatim, too. The mod's
 * import-free itemKeyOf mirrors this rule. */
export function itemKey(it: FeedItem): string {
  const value = (it.url || it.id).trim()
  return value.replace(/^(https?:\/\/)([^/?#]*)/i, (_match, scheme: string, authority: string) => {
    const hostStart = authority.lastIndexOf("@") + 1
    return scheme.toLowerCase() + authority.slice(0, hostStart) + authority.slice(hostStart).toLowerCase()
  })
}
