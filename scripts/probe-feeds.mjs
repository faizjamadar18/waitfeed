// Diagnostics: probe every WaitFeed channel with the same URLs the plugin uses.
// Run: node scripts/probe-feeds.mjs
const UA = "waitfeed/0.1 (local terminal ticker)"
const TIMEOUT = 10_000

const get = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT) })
  const body = await res.json()
  return { status: res.status, body }
}

const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)

const probes = [
  ["HN", `https://hacker-news.firebaseio.com/v0/topstories.json`],
  ["DEV", `https://dev.to/api/articles?per_page=15`],
  ["GH", `https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>${since} stars:>50`)}&sort=stars&order=desc&per_page=15`],
  ["R/PROG", `https://www.reddit.com/r/programming/.rss`],
]

for (const [name, url] of probes) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT) })
    const text = await res.text()
    const isXml = text.trimStart().startsWith("<?xml")
    console.log(`${name.padEnd(7)} HTTP ${res.status} · ${res.headers.get("content-type")?.split(";")[0]} · ${isXml ? "xml ok" : "not xml"}`)
  } catch (err) {
    console.log(`${name.padEnd(7)} FAILED: ${err?.cause?.code ?? err?.name ?? err?.message}`)
  }
}
