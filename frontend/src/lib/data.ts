export interface FeedItem {
  id: string;
  source: "HN" | "DEV" | "GH" | "R/PROG" | "RSS";
  title: string;
  url: string;
  /** The on-screen story: what happened + why a developer should care,
   * under 180 chars — the same shape the AI digest layer writes. */
  context: string;
  score?: number;
  /** Actual-TUI format ("1h", "3d") — the ticker stamps it with a leading "·". */
  ago: string;
}

/** Displayed in the navbar badge and footer. Bump per published npm release
 * so the page never advertises a version before it exists on the registry. */
export const WF_VERSION = "1.0.2";

/** Score display identical to the TUI formatter: 418 → "418", 19800 → "19.8k". */
export function fmtScoreTui(score: number): string {
  return score > 999 ? `${(score / 1000).toFixed(1)}k` : `${score}`;
}

/**
 * Sample stories for the hero demo. Each `context` is written the way the
 * real digest layer produces them: a strict rewrite of the headline +
 * description only (≤180 chars, no hashtags, no quotes, no invented facts),
 * dev-relevant in one glance. `score` is omitted for RSS items — the real
 * feed channel carries no score, so the TUI shows none.
 */
export const SAMPLE_STORIES: FeedItem[] = [
  {
    id: "hn-41829102",
    source: "HN",
    title: "SQLite in the browser with WebAssembly and OPFS",
    url: "https://news.ycombinator.com/item?id=41829102",
    context:
      "SQLite compiled to WASM with Origin Private File System storage — real, fast client-side persistence is finally practical for offline-first web apps.",
    score: 418,
    ago: "1h",
  },
  {
    id: "dev-90214",
    source: "DEV",
    title: "Understanding Node.js Event Loop and Libuv Threadpool",
    url: "https://dev.to/deepdive/nodejs-event-loop-internals",
    context:
      "Macro-tasks vs micro-tasks vs the libuv threadpool, clearly mapped — why async I/O behaves the way it does under high concurrency.",
    score: 184,
    ago: "3h",
  },
  {
    id: "gh-81902",
    source: "GH",
    title: "facebook/lexical",
    url: "https://github.com/facebook/lexical",
    context:
      "A cross-framework text-editor foundation built around accessibility, performance, and reliable state reconciliation across renderers.",
    score: 19800,
    ago: "5h",
  },
  {
    id: "reddit-5512",
    source: "R/PROG",
    title: "Why memory safety matters: A 10-year retrospective",
    url: "https://reddit.com/r/programming/comments/memory_safety",
    context:
      "Ten years of CVE data from large C++ codebases: what static analysis and Rust subsystems actually changed — and what they didn't.",
    score: 620,
    ago: "7h",
  },
  {
    id: "rss-simonw",
    source: "RSS",
    title: "Everything I built with LLMs this week",
    url: "https://simonwillison.net/2026/oct/entries/",
    context:
      "Prompt chaining, tiny local models on Apple Silicon, and a reproducible benchmark harness — this week's practical LLM notes.",
    ago: "8h",
  },
];

export const CHANNEL_COLORS: Record<string, string> = {
  HN: "#ff6600",
  DEV: "#8a63f4",
  GH: "#3fb950",
  "R/PROG": "#e36ba0",
  RSS: "#d29922",
};

export const COMPARISON_ROWS = [
  {
    medium: "Compilers & Builds",
    surface: "terminal progress bar",
    reaction: "switched tabs to Twitter / Reddit",
    outcome: "Lost focus for 20 minutes",
  },
  {
    medium: "CI / CD Pipelines",
    surface: "GitHub check waiting",
    reaction: "checked Slack and email",
    outcome: "Context switching debt",
  },
  {
    medium: "Commercial Ad Nets",
    surface: "agent wait slots",
    reaction: "injected sponsored ads",
    outcome: "Monetized attention capture",
  },
  {
    medium: "WaitFeed (OpenCode)",
    surface: "line above prompt",
    reaction: "ambient developer news",
    outcome: "100% local · vanishes on typing",
    isWaitFeed: true,
  },
];

export const FAQ_ITEMS = [
  {
    question: "Does WaitFeed send any telemetry or data to external servers?",
    answer:
      "No telemetry, no analytics, no accounts, no server — there is nothing to send data to. The only requests it ever makes are to the feed endpoints you keep enabled (Hacker News, dev.to, GitHub, Reddit, or your own RSS), once every 30 minutes, plus a short meta-description read of the pages those stories link to. Config and cache both live under ~/.config/waitfeed/ on your machine.",
  },
  {
    question: "Will this slow down my OpenCode agent or eat prompt tokens?",
    answer:
      "No. Feed fetching runs on a quiet 30-minute interval inside the plugin's server process — it never touches your prompt or context. The one-glance digests are written on a dedicated WaitFeed session inside your own OpenCode plan, strictly rewriting the fetched metadata (under 180 chars, no web research), never inside your project chats.",
  },
  {
    question: "How does the hide-on-type work? Does it swallow keys?",
    answer:
      "Never. There are no intercepting hooks in the wait surface — the ticker rides OpenCode's own TUI slot system and treats every keystroke as strictly yours. Start typing to your agent and the card gives the line back instantly; nothing is captured, buffered, or delayed.",
  },
  {
    question: "What happens if an API is down or I am offline?",
    answer:
      "It degrades quietly. Previous items are carried over for up to 36 hours, so a dead channel, a rate limit, or a failed generation never empties the ticker. If the digest layer itself is unavailable, the whole view flips to plain headlines and re-probes on the next cycle — you will never see an error banner in your terminal.",
  },
  {
    question: "Can I add private company feeds or custom RSS URLs?",
    answer:
      "Yes — up to 10 custom RSS/Atom feeds in ~/.config/waitfeed/config.json under \"rssUrls\". They always run on every fetch cycle and show with a distinct amber RSS badge, right next to the built-in channels.",
  },
];
