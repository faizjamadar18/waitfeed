export interface DocsNavItem {
  id: string;
  label: string;
  summary: string;
  group: "Start Here" | "Using WaitFeed" | "How It Works";
}

export const DOCS_NAV_GROUPS: Array<{
  title: DocsNavItem["group"];
  items: DocsNavItem[];
}> = [
  {
    title: "Start Here",
    items: [
      {
        id: "introduction",
        label: "Introduction",
        summary: "What WaitFeed does in 30 seconds",
        group: "Start Here",
      },
      {
        id: "quickstart",
        label: "Quickstart",
        summary: "One command setup + live terminal banner",
        group: "Start Here",
      },
    ],
  },
  {
    title: "Using WaitFeed",
    items: [
      {
        id: "editors",
        label: "Your AI Editors",
        summary: "OpenCode, Claude Code & Antigravity",
        group: "Using WaitFeed",
      },
      {
        id: "feeds",
        label: "News Channels & Custom RSS",
        summary: "Built-in tech feeds and personal blogs",
        group: "Using WaitFeed",
      },
      {
        id: "commands",
        label: "CLI Commands",
        summary: "Show, hide, toggle, and uninstall",
        group: "Using WaitFeed",
      },
    ],
  },
  {
    title: "How It Works",
    items: [
      {
        id: "visibility",
        label: "Smart Visibility",
        summary: "Why it hides the instant you start typing",
        group: "How It Works",
      },
      {
        id: "privacy",
        label: "Privacy & Local Storage",
        summary: "Zero API keys, local files & honest limits",
        group: "How It Works",
      },
      {
        id: "faq",
        label: "Troubleshooting & FAQ",
        summary: "Quick answers to common questions",
        group: "How It Works",
      },
    ],
  },
];

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
    badge: "Plugin + Fullscreen Reader",
    whereItShows: "Clean card directly above your typing prompt while the agent runs.",
    howToReadMore: "Type /feed anywhere to open the searchable headline popup.",
    howToHide: "Press Ctrl+O while working to dismiss or bring back the card.",
    highlights: [
      "Rotates unseen stories every 20 seconds so you never read the same headline twice in a row.",
      "Press Enter inside /feed to open the story in your browser.",
      "Turn individual channels on or off anytime right inside the popup.",
      "Never steals a single keystroke or interrupts your typing.",
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
    badge: "Band Above Prompt + /feed Pane",
    whereItShows: "In the band directly above your prompt while Claude is actively editing or running tools.",
    howToReadMore: "Type /feed in Claude Code (v2.1.295+) to browse headlines with arrow keys.",
    howToHide: "Press Ctrl+N while Claude works to toggle just the card, or run npx waitfeed hide claude.",
    highlights: [
      "Appears right after you press Enter and vanishes cleanly when Claude finishes.",
      "Pressing Esc to stop Claude hides the card immediately.",
      "Automatically yields if Claude asks you a question or requests tool permission.",
      "Inside /feed, use ↑ / ↓ to move, Enter to open the link, and Esc to close.",
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
    badge: "Agent Statusline",
    whereItShows: "Inside the Antigravity CLI statusline whenever the agent is actively working.",
    howToReadMore: "Ctrl+Click (or Cmd+Click on macOS) any headline link to open it in your browser.",
    howToHide: "Run npx waitfeed hide agy (or toggle agy) from another terminal.",
    highlights: [
      "Only shows during active states (working, running tools, reviewing).",
      "Keeps your home/idle prompt 100% quiet.",
      "Shares the same news cache and read list with OpenCode and Claude Code.",
      "Pause clock freezes automatically whenever the agent stops, so you never miss a card.",
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
  },
  {
    badge: "GH",
    color: "#3fb950",
    name: "GitHub Trending",
    whatYouGet: "Fast-rising open-source repositories created in the past 7 days.",
  },
  {
    badge: "DEV",
    color: "#8a63f4",
    name: "Dev.to",
    whatYouGet: "Practical coding tutorials, architecture writeups, and postmortems.",
  },
  {
    badge: "REDDIT",
    color: "#e36ba0",
    name: "Reddit r/programming",
    whatYouGet: "Community threads on software craft, releases, and languages.",
  },
  {
    badge: "RSS",
    color: "#d29922",
    name: "Your Custom RSS Feeds",
    whatYouGet: "Add up to 10 personal blogs, newsletters, or Atom feeds in config.",
  },
];

export const SIMPLE_CLI_COMMANDS = [
  {
    command: "npx waitfeed init",
    whenToUse: "First-time setup, adding a newly installed AI editor, or picking new channels.",
    whatItDoes: "Launches the setup wizard, detects your tools, and wires everything up safely.",
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
      "Stores which channels you enabled, your custom RSS URLs, how fast cards rotate (default: 20 seconds), and whether each editor is shown or hidden.",
  },
  {
    path: "~/.config/waitfeed/cache.json",
    role: "Saved Stories",
    plainDesc:
      "Holds up to 90 recent stories for 36 hours so cards appear instantly with zero waiting on network requests.",
  },
  {
    path: "~/.config/waitfeed/reader-state.json",
    role: "Read History",
    plainDesc:
      "Remembers which headlines you already read or glanced at, shared across OpenCode and Claude Code so you don't see repeats.",
  },
];

export const BEGINNER_FAQS = [
  {
    q: "I ran npx waitfeed init, why don't I see a news card right now?",
    a: "By design, WaitFeed stays invisible whenever your prompt is idle. Start a coding task or ask your AI agent to run a command—the card will appear automatically while it works and vanish when it finishes.",
  },
  {
    q: "Does WaitFeed use my AI tokens, API keys, or read my code?",
    a: "No. Zero tokens, zero API keys, and zero telemetry. WaitFeed never looks at your prompts, source files, or conversation history—it only checks whether your editor is currently busy or idle.",
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
    q: "Will `npx waitfeed remove` break my existing editor plugins or hooks?",
    a: "No. Removal only deletes the specific WaitFeed entries it added and leaves all your other plugins, hooks, keybindings, and environment variables untouched.",
  },
];
