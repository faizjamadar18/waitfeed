// WaitFeed LLM layer — one compact news story per headline, generated with
// the user's own OpenCode model. The design (user's idea): NO web research —
// the LLM receives only the metadata we already fetched (title, description,
// score, link) and rewrites it into a one-glance story (≤180 chars — two
// terminal lines).
// Generation runs through ctx.session.generate on a dedicated digest session,
// so it rides the same session pipeline as the user's own agent — the path
// OpenCode's free tier allows. Results cached by URL; bounded spend per cycle;
// the free-tier gate (if it still appears) disables the layer automatically.
import type { FeedItem } from "./types"

export function buildStoryPrompt(it: FeedItem): string {
  return [
    "You write one-glance news digests for a developer's terminal.",
    "From the metadata below ONLY (no web research, no invented details), write",
    "one or two very short plain-English sentences — together UNDER 180",
    "characters — that say what happened and why a developer should care.",
    "No hashtags, no emoji, no quotes. If the metadata is too thin, briefly",
    "say what the headline most likely refers to.",
    "",
    `Headline: ${it.title}`,
    it.context ? `Description: ${it.context}` : "Description: (none)",
    it.score !== undefined ? `Score: ${it.score}` : "",
    `Link: ${it.url}`,
  ]
    .filter((line) => line !== "")
    .join("\n")
}

/** Normalize the model's reply into clean flowing prose. Never cuts mid-word:
 * when over the ceiling, it ends at the last complete sentence inside the cap.
 * The 180-char default is tuned for the display contract: at a typical
 * terminal width it renders as two lines — never a wall of text. */
export function cleanStory(raw: string, max = 180): string {
  const one = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim()
  if (one.length <= max) return one
  const cut = one.slice(0, max)
  if (/[.!?]$/.test(cut)) return cut
  const lastSentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "))
  if (lastSentence >= 0) return cut.slice(0, lastSentence + 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : cut.length)}…`
}

/** The free-tier gate message, so callers can detect it and stop spending. */
export function isFreeTierGate(message: string): boolean {
  return message.includes("free tier")
}
