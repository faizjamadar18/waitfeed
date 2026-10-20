// WaitFeed LLM layer — one compact news story per headline, generated with
// the user's own OpenCode model. The design (user's idea): NO web research —
// the LLM receives only the metadata we already fetched (title, description,
// score, link) and STRICTLY REWRITES it: it may never add a detail from its
// own memory. Two doors make that provable, not just insistent:
//
//   Door 1 — `isStoryable`: only items with a usable description (>=80 chars,
//   not an echo of the headline) ever reach the model. This is a pipeline
//   check the code can prove; it stops ~99% of weak items at zero cost.
//   Door 2 — the NEEDS_MORE handshake: length/echo checks cannot read
//   meaning (ad slogans, off-topic meta text, another language), so the
//   model must answer NEEDS_MORE when it cannot write honestly from ONLY
//   the given text. The writer bins that reply — the item stays invisible
//   rather than rendering a made-up or padded line.
//
// Generation runs through ctx.session.generate on a dedicated digest session,
// so it rides the same session pipeline as the user's own agent — the path
// OpenCode's free tier allows. Results cached by URL; bounded spend per cycle;
// the free-tier gate (if it still appears) disables the layer automatically.
import type { FeedItem } from "./types"
import { isContextDuplicate } from "./ticker"

/** Smallest usable description: enough substance to rewrite from, and clearly
 * not an echo of the headline (the echo rule itself lives in the ticker). */
const DESCRIPTION_MIN = 80

/** The word the model must reply with instead of inventing content. Never
 * rendered — the writer treats it as "no story for this item". */
export const NEEDS_MORE = "NEEDS_MORE"

export function buildStoryPrompt(it: FeedItem): string {
  return [
    "You write one-glance news digests for a developer's terminal.",
    "From the metadata below ONLY (no web research, no invented details), write",
    "one or two very short plain-English sentences — together UNDER 180",
    "characters — that say what happened and why a developer should care.",
    "Ground every claim in the description text below.",
    "No hashtags, no emoji, no quotes.",
    `If the description is not enough to write that honestly, reply with`,
    `exactly ${NEEDS_MORE} and nothing else.`,
    "",
    `Headline: ${it.title}`,
    it.context ? `Description: ${it.context}` : "Description: (none)",
    it.score !== undefined ? `Score: ${it.score}` : "",
    `Link: ${it.url}`,
  ]
    .filter((line) => line !== "")
    .join("\n")
}

/** Detect the honest cannot-write reply. Bins any reply that LEADS with the
 * handshake word — whatever follows is a filler explanation, not prose. */
export function isNeedsMoreReply(raw: string): boolean {
  const head = raw.trim().replace(/^["'`\W]+/, "")
  return /^NEEDS[\s_-]*MORE/i.test(head)
}

/** Door 1 — the pre-model gate. Items without a real description never burn
 * a story attempt (and therefore never appear in story mode). */
export function isStoryable(it: FeedItem): boolean {
  const desc = it.context?.trim() ?? ""
  if (desc.length < DESCRIPTION_MIN) return false
  if (isContextDuplicate(it.title, desc)) return false
  return true
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
