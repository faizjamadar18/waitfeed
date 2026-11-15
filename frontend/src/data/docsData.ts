export interface DocsNavItem {
  id: string;
  label: string;
  summary: string;
  group: string;
  badge?: string;
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

export const VERCEL_DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    title: "Start",
    items: [
      {
        id: "overview",
        label: "Overview",
        summary: "What WaitFeed does in 30 seconds",
        group: "Start",
      },
      {
        id: "quickstart",
        label: "Quickstart",
        summary: "One command setup with interactive terminal wizard",
        group: "Start",
        badge: "INSTALL",
      },
      {
        id: "architecture",
        label: "Zero-Token Architecture",
        summary: "Local cache pipeline, cycle locks, and zero LLM cost",
        group: "Start",
        badge: "0 TOKENS",
      },
    ],
  },
  {
    title: "AI Coding Agents",
    items: [
      {
        id: "agent-opencode",
        label: "OpenCode",
        summary: "Above-prompt card, /feed reader, and Ctrl+O shortcut",
        group: "AI Coding Agents",
        badge: "TUI PLUGIN",
      },
      {
        id: "agent-claude",
        label: "Claude Code",
        summary: "AbovePrompt band mod, /feed pane, and Ctrl+N toggle",
        group: "AI Coding Agents",
        badge: "BAND HOOK",
      },
      {
        id: "agent-agy",
        label: "Antigravity (AGY)",
        summary: "Autonomous agent_state statusline integration",
        group: "AI Coding Agents",
        badge: "STATE SYNC",
      },
    ],
  },
  {
    title: "Feeds & Pipeline",
    items: [
      {
        id: "feeds-builtin",
        label: "Built-in Channels",
        summary: "Hacker News, GitHub Trending, Dev.to, and Reddit",
        group: "Feeds & Pipeline",
      },
      {
        id: "feeds-custom",
        label: "Custom RSS & Atom",
        summary: "Add personal engineering blogs, arXiv, and newsletters",
        group: "Feeds & Pipeline",
        badge: "CUSTOM",
      },
      {
        id: "feeds-cache",
        label: "Local Cache & Locks",
        summary: "Shared ~/.config/waitfeed/cache.json & cycle.lock",
        group: "Feeds & Pipeline",
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        id: "config-schema",
        label: "config.json Schema",
        summary: "Channels, dwellSeconds, custom feeds, and editor states",
        group: "Configuration",
      },
      {
        id: "config-storage",
        label: "Storage & Read History",
        summary: "Shared 36-hour story pool and cross-agent read history",
        group: "Configuration",
      },
    ],
  },
  {
    title: "CLI Reference",
    items: [
      {
        id: "cli-init",
        label: "waitfeed init",
        summary: "Auto-detect agents and run the interactive setup wizard",
        group: "CLI Reference",
      },
      {
        id: "cli-show-hide",
        label: "waitfeed show / hide",
        summary: "Mute or restore cards globally or per-agent without uninstalling",
        group: "CLI Reference",
      },
      {
        id: "cli-toggle",
        label: "waitfeed toggle",
        summary: "Quick keyboard toggle for shell aliases and scripts",
        group: "CLI Reference",
      },
      {
        id: "cli-remove",
        label: "waitfeed remove",
        summary: "Reversible uninstaller with optional --keep-data flag",
        group: "CLI Reference",
      },
    ],
  },
  {
    title: "Safety & FAQ",
    items: [
      {
        id: "smart-visibility",
        label: "Smart Visibility",
        summary: "Instant hide-on-type, busy detection, non-blocking guarantee",
        group: "Safety & FAQ",
      },
      {
        id: "faq",
        label: "Frequently Asked Questions",
        summary: "Answers on tokens, privacy, multi-agent support, and troubleshooting",
        group: "Safety & FAQ",
      },
    ],
  },
];

// Preserving DOCS_NAV_GROUPS alias for backward compatibility
export const DOCS_NAV_GROUPS = VERCEL_DOCS_NAV_GROUPS;

/**
 * Exact 3D ASCII startup banner printed by `npx waitfeed init`
 * in packages/waitfeed/bin.mjs, along with its 6-row amber gradient stops.
 */
export const ASCII_BANNER_ROWS: Array<{
  text: string;
  frontHex: string;
  shadowHex: string;
}> = [
  {
    text: "██╗    ██╗ █████╗ ██╗████████╗███████╗███████╗███████╗██████╗ ",
    frontHex: "#ffd9a0",
    shadowHex: "#665740",
  },
  {
    text: "██║    ██║██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝██╔════╝██╔══██╗",
    frontHex: "#ffba6c",
    shadowHex: "#664a2b",
  },
  {
    text: "██║ █╗ ██║███████║██║   ██║   █████╗  █████╗  █████╗  ██║  ██║",
    frontHex: "#ff9a38",
    shadowHex: "#663e16",
  },
  {
    text: "██║███╗██║██╔══██║██║   ██║   ██╔══╝  ██╔══╝  ██╔══╝  ██║  ██║",
    frontHex: "#ec7819",
    shadowHex: "#5e300a",
  },
  {
    text: "╚███╔███╔╝██║  ██║██║   ██║   ██║     ███████╗███████╗██████╔╝",
    frontHex: "#d86411",
    shadowHex: "#562807",
  },
  {
    text: " ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝     ╚══════╝╚══════╝╚═════╝ ",
    frontHex: "#c4500a",
    shadowHex: "#4e2004",
  },
];

export type EditorKey = "opencode" | "claude" | "agy";

export interface EditorGuide {
  key: EditorKey;
  name: string;
  badge: string;
  whereItShows: string;
  howToReadMore: string;
  howToHide: string;
  highlights: string[];
  terminalTitle: string;
  commandSnippet: string;
  sampleLines: Array<{
    kind: "command" | "muted" | "badge" | "body" | "link" | "status";
    text: string;
    extra?: string;
    badgeColor?: string;
  }>;
}

export const EDITOR_GUIDES: EditorGuide[] = [
  {
    key: "opencode",
    name: "OpenCode",
    badge: "Solid TUI Plugin",
    whereItShows: "Clean card rendered directly above your typing prompt while the agent runs.",
    howToReadMore: "Type /feed anywhere in OpenCode to open the searchable headline modal.",
    howToHide: "Press Ctrl+O while working to dismiss or restore the card instantly.",
    highlights: [
      "Zero LLM tokens: OpenCode uses the shared Headline + Description + Link pipeline.",
      "Rotates unseen stories every 20 seconds so you never read the same headline twice in a row.",
      "Press Enter inside /feed to open the story in your default browser.",
      "Never steals a single keystroke or interrupts prompt typing.",
    ],
    terminalTitle: "opencode · waiting for build",
    commandSnippet: "npx waitfeed toggle opencode",
    sampleLines: [
      { kind: "muted", text: "  Bash · vitest run tests/auth.test.ts (running...)" },
      {
        kind: "badge",
        text: "▍ [HN]  AI writes 40% of boilerplate, shifting devs to system design",
        extra: "▲ 1.4k · 2h",
        badgeColor: "#ff6600",
      },
      {
        kind: "body",
        text: "   Teams report spending less time on repetitive glue code and more on architecture reviews.",
      },
      { kind: "link", text: "   > news.ycombinator.com/item?id=39918204" },
      { kind: "status", text: "ctrl+o hide feed  ·  /feed browse all stories" },
    ],
  },
  {
    key: "claude",
    name: "Claude Code",
    badge: "AbovePrompt Hook",
    whereItShows: "In the AbovePrompt band directly above your prompt while Claude is editing or running tools.",
    howToReadMore: "Type /feed in Claude Code (v2.1.295+) to browse headlines with arrow keys.",
    howToHide: "Press Ctrl+N while Claude works to toggle just the card, or run npx waitfeed hide claude.",
    highlights: [
      "Rides the host's AbovePrompt band gated on the host's own isWorking status.",
      "Appears right after you press Enter and vanishes cleanly when Claude finishes.",
      "Pressing Esc to stop Claude hides the card immediately.",
      "Automatically yields if Claude asks you a question or requests tool permission.",
    ],
    terminalTitle: "claude · working",
    commandSnippet: "npx waitfeed toggle claude",
    sampleLines: [
      { kind: "muted", text: "  ✻ Editing src/middleware/rate-limit.ts..." },
      {
        kind: "badge",
        text: "▍ [GH]  chenglou/pretext · Fast multilingual text layout without DOM reflow",
        extra: "▲ 8.2k · 4h",
        badgeColor: "#3fb950",
      },
      {
        kind: "body",
        text: "   Lightweight canvas and terminal text measurement library for predictable wrapping.",
      },
      { kind: "link", text: "   > github.com/chenglou/pretext" },
      { kind: "status", text: "Ctrl+N hides or shows the card  ·  /feed browses headlines" },
    ],
  },
  {
    key: "agy",
    name: "Antigravity (AGY)",
    badge: "agent_state Sync",
    whereItShows: "Inside the Antigravity statusline whenever the agent is actively executing.",
    howToReadMore: "Ctrl+Click (or Cmd+Click on macOS) any headline link to open it in your browser.",
    howToHide: "Run npx waitfeed hide agy from any terminal to pause Antigravity news cards.",
    highlights: [
      "Only shows during active states (working, running tools, executing workflows).",
      "Keeps your home/idle prompt 100% quiet.",
      "Shares the same news cache and read list with OpenCode and Claude Code.",
      "Pause clock freezes automatically whenever the agent stops, preserving current position.",
    ],
    terminalTitle: "agy · agent executing",
    commandSnippet: "npx waitfeed toggle agy",
    sampleLines: [
      { kind: "muted", text: "  ▸ Running integration suite across 12 packages..." },
      {
        kind: "badge",
        text: "▍ [DEV] How zero-copy queues cut terminal UI latency in half",
        extra: "▲ 410 · 3h",
        badgeColor: "#8a63f4",
      },
      {
        kind: "body",
        text: "   Simple patterns for smoothing rapid redraws without blocking user input.",
      },
      { kind: "link", text: "   > dev.to/perf/zero-copy-terminal-queues" },
      { kind: "status", text: "Ctrl+Click link to read  ·  npx waitfeed hide agy to pause" },
    ],
  },
];

export const BUILTIN_CHANNELS = [
  {
    badge: "HN",
    color: "#ff6600",
    name: "Hacker News",
    whatYouGet: "Top tech discussions, Show HN launches, and engineering deep dives.",
    feedUrl: "news.ycombinator.com/rss",
  },
  {
    badge: "GH",
    color: "#3fb950",
    name: "GitHub Trending",
    whatYouGet: "Fast-rising open-source repositories created in the past 7 days.",
    feedUrl: "github.com/trending",
  },
  {
    badge: "DEV",
    color: "#8a63f4",
    name: "Dev.to",
    whatYouGet: "Practical coding tutorials, architecture writeups, and postmortems.",
    feedUrl: "dev.to/feed",
  },
  {
    badge: "REDDIT",
    color: "#e36ba0",
    name: "Reddit r/programming",
    whatYouGet: "Community threads on software craft, releases, and programming languages.",
    feedUrl: "reddit.com/r/programming/.rss",
  },
  {
    badge: "RSS",
    color: "#d29922",
    name: "Your Custom RSS Feeds",
    whatYouGet: "Add up to 10 personal blogs, newsletters, or Atom feeds in config.",
    feedUrl: "Custom URLs in config.json",
  },
];

export const SIMPLE_CLI_COMMANDS = [
  {
    command: "npx waitfeed init",
    whenToUse: "First-time setup, adding a newly installed AI editor, or re-configuring channels.",
    whatItDoes: "Launches the setup wizard, detects your tools, stages adapter bundles, and wires host configs.",
  },
  {
    command: "npx waitfeed hide [editor]",
    whenToUse: "You want full focus right now without uninstalling anything.",
    whatItDoes:
      "Hides cards immediately. Pass opencode, claude, or agy to mute just one tool (or omit to mute all).",
  },
  {
    command: "npx waitfeed show [editor]",
    whenToUse: "You hid WaitFeed earlier and want stories back while your agent works.",
    whatItDoes:
      "Turns automatic cards back on. Never clutters an idle terminal—still only shows during busy turns.",
  },
  {
    command: "npx waitfeed toggle [editor]",
    whenToUse: "Bind to a shell alias or quick shortcut to flip between hidden and auto.",
    whatItDoes: "Switches WaitFeed on or off cleanly for all tools or a single named editor.",
  },
  {
    command: "npx waitfeed remove",
    whenToUse: "You want WaitFeed completely gone from your system.",
    whatItDoes:
      "Cleanly removes WaitFeed settings from every editor and deletes local data. Add --keep-data to save preferences.",
  },
];

export const LOCAL_FILES_EXPLAINED = [
  {
    path: "~/.config/waitfeed/config.json",
    role: "Your Settings",
    plainDesc:
      "Stores enabled channels, custom RSS URLs, card rotation speed (default: 20 seconds), and per-editor visibility states.",
  },
  {
    path: "~/.config/waitfeed/cache.json",
    role: "Saved Stories Pool",
    plainDesc:
      "Holds up to 90 recent stories for 36 hours so cards appear instantly with zero waiting on network requests.",
  },
  {
    path: "~/.config/waitfeed/reader-state.json",
    role: "Read History Ledger",
    plainDesc:
      "Remembers which headlines you already read or glanced at, shared across OpenCode, Claude Code, and Antigravity so you don't see repeats.",
  },
  {
    path: "~/.config/waitfeed/cycle.lock",
    role: "Process Serialization",
    plainDesc:
      "File-based lock with stale TTL preventing race conditions when multiple agent windows update the cache concurrently.",
  },
];

export const BEGINNER_FAQS = [
  {
    q: "I ran npx waitfeed init, why don't I see a news card right now?",
    a: "By design, WaitFeed stays 100% invisible whenever your prompt is idle. Start a coding task or ask your AI agent to run a command—the card will appear automatically while it works and vanish the instant it finishes.",
  },
  {
    q: "Does WaitFeed use my AI tokens, API keys, or read my code?",
    a: "No. Zero tokens, zero API keys, zero telemetry, and keyless by design. WaitFeed never looks at your prompts, source files, or conversation history—it only checks whether your editor is currently busy or idle.",
  },
  {
    q: "Can I add my favorite engineering blogs or newsletters?",
    a: "Yes! During `npx waitfeed init` you can paste an RSS URL, or later add up to 10 feeds inside `~/.config/waitfeed/config.json` under `\"rssUrls\": [\"https://...\"]`.",
  },
  {
    q: "Can I hide WaitFeed in Claude Code while keeping it active in OpenCode?",
    a: "Yes. Every tool has its own independent switch. Run `npx waitfeed hide claude` to pause Claude Code without touching OpenCode or Antigravity.",
  },
  {
    q: "Will npx waitfeed remove break my existing editor plugins or hooks?",
    a: "No. Removal is fully idempotent and safe. It only deletes the specific WaitFeed entries it added and leaves all your other plugins, hooks, keybindings, and environment variables untouched.",
  },
  {
    q: "How does the zero-token pipeline fetch news?",
    a: "A background fetch → enrich → junk-drop pipeline updates `~/.config/waitfeed/cache.json` using pure HTTP RSS parsing with `rss-parser`. All adapters only read the local JSON file. Zero LLMs, zero API keys, zero cost.",
  },
];
