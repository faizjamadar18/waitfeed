export interface DocsNavItem {
  id: string;
  label: string;
  group: "Getting Started" | "Core Engine" | "Host Adapters" | "Internals & Ops";
  codeRef?: string;
}

export const DOCS_NAV_GROUPS: Array<{
  title: DocsNavItem["group"];
  items: DocsNavItem[];
}> = [
  {
    title: "Getting Started",
    items: [
      { id: "overview", label: "Overview & Principles", group: "Getting Started", codeRef: "README.md" },
      { id: "cli", label: "CLI & Setup Wizard", group: "Getting Started", codeRef: "bin.mjs" },
      { id: "configuration", label: "Configuration", group: "Getting Started", codeRef: "core/config.ts" },
    ],
  },
  {
    title: "Core Engine",
    items: [
      { id: "pipeline", label: "Shared Data Pipeline", group: "Core Engine", codeRef: "core/pipeline.ts" },
      { id: "feeds", label: "Feed Channels", group: "Core Engine", codeRef: "core/feeds.ts" },
      { id: "enrichment", label: "Enrichment & Filtering", group: "Core Engine", codeRef: "core/enrich.ts" },
      { id: "ledger", label: "Reader Ledger & Rotation", group: "Core Engine", codeRef: "core/reader-state.ts" },
    ],
  },
  {
    title: "Host Adapters",
    items: [
      { id: "opencode", label: "OpenCode Adapter", group: "Host Adapters", codeRef: "opencode/tui.tsx" },
      { id: "claude", label: "Claude Code + Mod", group: "Host Adapters", codeRef: "claude/src/" },
      { id: "agy", label: "Antigravity (AGY)", group: "Host Adapters", codeRef: "core/agy.ts" },
    ],
  },
  {
    title: "Internals & Ops",
    items: [
      { id: "filesystem", label: "Local Filesystem Map", group: "Internals & Ops", codeRef: "~/.config/waitfeed/" },
      { id: "development", label: "Monorepo, Build & Tests", group: "Internals & Ops", codeRef: "tests/" },
      { id: "limits", label: "Honest Limits & Privacy", group: "Internals & Ops", codeRef: "core/llm.ts" },
    ],
  },
];

export interface PipelineStage {
  id: string;
  step: string;
  name: string;
  file: string;
  summary: string;
  details: string[];
  constants: Array<{ key: string; value: string }>;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "lock",
    step: "01",
    name: "Cycle Lock & Freshness Gate",
    file: "packages/waitfeed/core/pipeline.ts",
    summary:
      "Serializes concurrent runs across OpenCode, Claude Code, and AGY using an exclusive lock file and checks whether the standing cache is still fresh or needs a low-water refill.",
    details: [
      "Acquires ~/.config/waitfeed/cycle.lock with wx exclusive create; steals locks older than 10 minutes (LOCK_TTL_MS).",
      "Skips fetching if cache.json is younger than 30 minutes (REFRESH_MS_DEFAULT), unless unread items drop below 5 (LOW_WATER_UNREAD).",
      "Enforces a 60-second minimum floor (MIN_TOPUP_GAP_MS) between low-water refills so rapid reading never hammers upstream feeds.",
    ],
    constants: [
      { key: "REFRESH_MS_DEFAULT", value: "30 min" },
      { key: "LOCK_TTL_MS", value: "10 min" },
      { key: "LOW_WATER_UNREAD", value: "5 items" },
      { key: "MIN_TOPUP_GAP_MS", value: "60 sec" },
    ],
  },
  {
    id: "fetch",
    step: "02",
    name: "Parallel Channel Fetch",
    file: "packages/waitfeed/core/feeds.ts",
    summary:
      "Polls only enabled built-in channels plus up to 10 user RSS/Atom feeds via Promise.allSettled with a 10s timeout per request.",
    details: [
      "Disabled channels in config.json are never contacted at all.",
      "Every fetcher degrades to an empty array on failure and records an explicit ChannelStatus entry for probe.log.",
      "Reddit uses its Atom RSS feed because Reddit returns HTTP 403 HTML to non-browser JSON clients.",
    ],
    constants: [
      { key: "TIMEOUT_MS", value: "10,000 ms" },
      { key: "HN_LOOK", value: "90 items" },
      { key: "CONTEXT_MAX", value: "600 chars" },
      { key: "max rssUrls", value: "10 feeds" },
    ],
  },
  {
    id: "merge",
    step: "03",
    name: "Dedupe, Retain & Language Gate",
    file: "packages/waitfeed/core/ticker.ts",
    summary:
      "Merges fresh items newest-first, carries surviving items from the previous cycle for 36 hours, and strips non-English scripts before any page enrichment runs.",
    details: [
      "mergeItems() deduplicates by (url || id).trim().toLowerCase() and sorts descending by epoch timestamp.",
      "retainMerge() carries previous items up to 36 hours (RETAIN_TTL_MS) and caps the pool at 90 items (CACHE_ITEMS_DEFAULT); fresh items win URL collisions.",
      "dropNonEnglish() filters out Cyrillic, Arabic, Hebrew, Devanagari, Bengali, Tamil, Thai, Hangul, Kana, and Han characters right after merge.",
    ],
    constants: [
      { key: "RETAIN_TTL_MS", value: "36 hours" },
      { key: "CACHE_ITEMS_DEFAULT", value: "90 items" },
      { key: "mergeItems cap", value: "30 / cycle" },
      { key: "Order", value: "Newest-first" },
    ],
  },
  {
    id: "enrich",
    step: "04",
    name: "Batched Meta Enrichment",
    file: "packages/waitfeed/core/enrich.ts",
    summary:
      "Fetches HTML meta descriptions (og:description / description) for link posts lacking context, in bounded parallel batches.",
    details: [
      "Runs in batches of 8 (BATCH = 8) up to a hard budget of 24 page visits per cycle (MAX_PER_CYCLE).",
      "Skips news.ycombinator.com and reddit.com links because discussion threads lack story meta or block bot fetches.",
      "Reads at most 300 KB of text/html, decodes HTML entities, trims at sentence boundaries (240 chars), and drops headline echoes via isContextDuplicate().",
    ],
    constants: [
      { key: "MAX_PER_CYCLE", value: "24 pages" },
      { key: "BATCH", value: "8 concurrent" },
      { key: "TIMEOUT_MS", value: "8,000 ms" },
      { key: "MAX_CONTEXT", value: "240 chars" },
    ],
  },
  {
    id: "write",
    step: "05",
    name: "Junk Drop & Atomic Cache Save",
    file: "packages/waitfeed/core/pipeline.ts",
    summary:
      "Drops unreadable single-token bare identifiers, preserves unknown host-private keys, and atomically swaps cache.json via temp-file rename.",
    details: [
      "isJunkTitle() rejects single-word bare identifiers (e.g. model slugs without spaces) while keeping owner/repo pairs like chenglou/handwired.",
      "writeCacheDoc() writes to cache.json.<ts>.tmp and atomically renames over cache.json so concurrent readers never observe partial JSON.",
      "readCacheDoc() extracts and re-attaches unknown top-level keys (extra) so host-specific fields are never clobbered.",
    ],
    constants: [
      { key: "Write pattern", value: "tmp + rename" },
      { key: "Log rotation", value: "100 KB" },
      { key: "API keys used", value: "0" },
      { key: "Always unlocked", value: "finally unlink" },
    ],
  },
];

export const CLI_COMMANDS = [
  {
    cmd: "npx waitfeed init",
    alias: "npx waitfeed",
    effect: "Runs the interactive TTY wizard: detects OpenCode, AGY, and Claude Code, configures channels & custom RSS, saves config.json, and wires host integrations idempotently.",
  },
  {
    cmd: "npx waitfeed remove [--keep-data]",
    alias: "npx waitfeed uninstall",
    effect: "Surgically removes WaitFeed config entries and staged bundles across all three hosts while preserving foreign plugins/hooks; deletes ~/.config/waitfeed/ unless --keep-data is passed.",
  },
  {
    cmd: "npx waitfeed hide [host]",
    alias: "host: opencode | claude | agy",
    effect: "Sets newsMode to \"hide\" globally or for a single host in config.json. When targeting Claude Code, immediately flips statusLine.command (\" --wf\") for instant repaint.",
  },
  {
    cmd: "npx waitfeed show [host]",
    alias: "npx waitfeed auto [host]",
    effect: "Restores \"auto\" mode so the card appears whenever the agent is actively executing and stays quiet when idle.",
  },
  {
    cmd: "npx waitfeed toggle [host]",
    alias: "host: opencode | claude | agy",
    effect: "Flips the target host (or all hosts) between \"hide\" and \"auto\" without ever pinning cards onto an idle prompt.",
  },
  {
    cmd: "npx waitfeed --version | --help",
    alias: "-v / -h",
    effect: "Prints the installed waitfeed package version or CLI usage summary.",
  },
];

export const FEED_SOURCES = [
  {
    key: "hn",
    badge: "HN",
    colorHex: "#ff6600",
    ansi: "38;5;202",
    endpoint: "https://hacker-news.firebaseio.com/v0/topstories.json",
    fetchLimit: "Top 90 IDs (item/{id}.json)",
    notes: "Self-post bodies (Ask/Show HN) stripped of HTML; external URLs enriched via meta description.",
  },
  {
    key: "github",
    badge: "GH",
    colorHex: "#3fb950",
    ansi: "38;5;71",
    endpoint: "https://api.github.com/search/repositories?q=created:>7d+stars:>50&sort=stars",
    fetchLimit: "30 repos / cycle",
    notes: "Title keeps exact owner/repo format; repo description populates context; stars map to ▲ score.",
  },
  {
    key: "devto",
    badge: "DEV",
    colorHex: "#8a63f4",
    ansi: "38;5;99",
    endpoint: "https://dev.to/api/articles?per_page=30",
    fetchLimit: "30 articles / cycle",
    notes: "Includes article description and positive_reactions_count natively in a single JSON call.",
  },
  {
    key: "reddit",
    badge: "REDDIT",
    colorHex: "#e36ba0",
    ansi: "38;5;133",
    endpoint: "https://www.reddit.com/r/programming/.rss",
    fetchLimit: "25 entries / cycle",
    notes: "Stored internally with source \"R/PROG\" (mapped via SOURCE_ALIASES). Strips boilerplate \"submitted by /u/\" snippets.",
  },
  {
    key: "rssUrls",
    badge: "RSS",
    colorHex: "#d29922",
    ansi: "38;5;136",
    endpoint: "User-supplied RSS / Atom URLs (up to 10)",
    fetchLimit: "15 entries / feed",
    notes: "Always enabled when present in config.json; parsed via rss-parser with contentSnippet extraction.",
  },
];

export const CLAUDE_HOOKS = [
  { event: "SessionStart", flags: "--cycle", mode: "sync", purpose: "Runs one fetch -> enrich -> cache cycle in headline mode." },
  { event: "SessionStart", flags: "--idle", mode: "sync", purpose: "Marks the new session idle so the splash screen stays quiet." },
  { event: "SessionStart", flags: "--watch", mode: "sync", purpose: "Returns { watchPaths: [transcript_path] } to arm instant Esc detection." },
  { event: "UserPromptSubmit", flags: "--heartbeat", mode: "async", purpose: "Marks session busy=true, resets turn hide->auto, flips statusLine." },
  { event: "PostToolUse / Failure", flags: "--heartbeat", mode: "async", purpose: "Refreshes busy timestamp while keeping user mid-turn hide intact." },
  { event: "PermissionDenied", flags: "--heartbeat", mode: "async", purpose: "Control returned to agent after denied permission -> busy=true." },
  { event: "PermissionRequest", flags: "--idle", mode: "async", purpose: "Agent waiting on user approval -> card hides immediately." },
  { event: "PreToolUse (AskUserQuestion)", flags: "--idle", mode: "async", purpose: "Hides card before blocking on a user question prompt." },
  { event: "Notification (elicitation_*)", flags: "--idle", mode: "async", purpose: "Hides card during MCP elicitation_dialog / elicitation_url_dialog." },
  { event: "Notification (idle_prompt)", flags: "--idle", mode: "async", purpose: "60s idle fallback ensures interrupted turns settle quietly." },
  { event: "FileChanged", flags: "--interrupt-check", mode: "async", purpose: "Scans transcript tail for [Request interrupted by user -> instant hide." },
  { event: "Stop / StopFailure / SessionEnd", flags: "--idle", mode: "async / sync", purpose: "Ends turn or session; SessionEnd runs sync within 1.5s budget." },
];

export const FILESYSTEM_MAP = [
  {
    path: "~/.config/waitfeed/config.json",
    owner: "Shared (CLI + all hosts)",
    purpose: "Channel toggles (hn, devto, github, reddit), rssUrls (max 10), dwellSeconds (5-120), global newsMode & per-host newsModes.",
  },
  {
    path: "~/.config/waitfeed/cache.json",
    owner: "Pipeline -> all readers",
    purpose: "Fetched, deduped, enriched FeedItem[] pool (max 90, 36h TTL), fetchedAt, summaries, llmUnavailable.",
  },
  {
    path: "~/.config/waitfeed/reader-state.json",
    owner: "OpenCode TUI + Claude Mod",
    purpose: "Shared { read, glanced } epoch-ms ledger keyed by itemKey(it), pruned at 36h. Drives SEEN / UPCOMING piles and low-water refill.",
  },
  {
    path: "~/.config/waitfeed/cycle.lock",
    owner: "core/pipeline.ts",
    purpose: "Concurrency guard storing lock epoch ms; stolen after 10 minutes if a prior run crashed.",
  },
  {
    path: "~/.config/waitfeed/claude-activity.json",
    owner: "Claude hooks + statusline",
    purpose: "Per-session_id { busy, at } ledger (15m busy staleness, 60m session prune).",
  },
  {
    path: "~/.config/waitfeed/claude-rotation.json",
    owner: "Claude statusline",
    purpose: "Wall-clock dwell state { ticks, windowStart } so redraws within one dwell window stay on the same card.",
  },
  {
    path: "~/.config/waitfeed/agy-rotation.json",
    owner: "AGY statusline",
    purpose: "Wall-clock dwell state { ticks, windowStart } frozen whenever AGY is idle.",
  },
  {
    path: "~/.config/waitfeed/probe.log & debug.log",
    owner: "Pipeline & OpenCode TUI",
    purpose: "Diagnostic logs auto-truncated when exceeding 100 KB (probe.log) or 200 KB (debug.log).",
  },
];

export const TEST_SUITES = [
  { file: "tests/config.test.ts", focus: "normalizeConfig bounds, per-host newsMode overrides, newsVisible() matrix, SOURCE_ALIASES." },
  { file: "tests/ticker.test.ts", focus: "Sentence boundary cuts, junk/foreign-script filters, retainMerge 36h TTL, formatDividerLine breakpoints." },
  { file: "tests/pipeline.test.ts", focus: "End-to-end mocked fetch -> enrich -> cache cycle, cycle.lock contention & stale-lock theft, low-water refill." },
  { file: "tests/reader.test.ts", focus: "reader-state.json persistence, read/glanced ledger marks, SEEN/UPCOMING grouping, 36h pruning." },
  { file: "tests/agy.test.ts", focus: "AGY session state gating, word-wrapping headlines/descriptions, right-justified meta, OSC 8 link splitting." },
  { file: "tests/agy-bundle.test.ts", focus: "Plain-Node E2E against built agy/dist/statusline.mjs & scheduler.mjs." },
  { file: "tests/claude.test.ts", focus: "Activity ledger, COLUMNS - 4 margin reserve, --wf flip, Esc-interrupt tail scanner & timestamp guard." },
  { file: "tests/claude-bundle.test.ts", focus: "Plain-Node E2E spawning built claude/dist/statusline.mjs & scheduler.mjs with temp dirs." },
  { file: "tests/claude-mod.test.ts", focus: "Static-analysis & contract verification for claude-mod/hooks/register.js." },
  { file: "tests/cli.test.ts", focus: "init idempotency, remove --keep-data surgical cleanup, JSONC comment stripping, show/hide/toggle." },
  { file: "tests/package.test.ts", focus: "Consumer-machine safety: @jsxImportSource pragma, shipped tsconfig, zero React/cwd/__dirname leaks." },
];

