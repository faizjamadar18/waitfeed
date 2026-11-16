export interface DocsNavItem {
  id: string;
  label: string;
  summary: string;
  group: string;
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

/** Keep this in step with packages/waitfeed/package.json. */
export const WAITFEED_VERSION = "1.3.0";

export const VERCEL_DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    title: "Get started",
    items: [
      {
        id: "overview",
        label: "Overview",
        summary: "What WaitFeed does and where the card appears",
        group: "Get started",
      },
      {
        id: "quickstart",
        label: "Quickstart",
        summary: "Install once and see your first card",
        group: "Get started",
      },
      {
        id: "architecture",
        label: "How it works",
        summary: "Shared cache, refresh cycle, and visibility rules",
        group: "Get started",
      },
    ],
  },
  {
    title: "Agents",
    items: [
      {
        id: "agent-opencode",
        label: "OpenCode",
        summary: "Prompt card, /feed popup, Ctrl+O",
        group: "Agents",
      },
      {
        id: "agent-claude",
        label: "Claude Code",
        summary: "AbovePrompt band, /feed pane, Ctrl+N",
        group: "Agents",
      },
      {
        id: "agent-agy",
        label: "Antigravity",
        summary: "Statusline card and shell toggles",
        group: "Agents",
      },
    ],
  },
  {
    title: "Feeds",
    items: [
      {
        id: "feeds-builtin",
        label: "Channels",
        summary: "Hacker News, Dev.to, GitHub Trending, and Reddit",
        group: "Feeds",
      },
      {
        id: "feeds-custom",
        label: "Custom feeds",
        summary: "Add up to 10 RSS or Atom URLs",
        group: "Feeds",
      },
    ],
  },
  {
    title: "Configure",
    items: [
      {
        id: "config-schema",
        label: "config.json",
        summary: "Keys, defaults, and fallback behavior",
        group: "Configure",
      },
      {
        id: "config-storage",
        label: "Local data",
        summary: "Cache, reader history, and lock files",
        group: "Configure",
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        id: "cli-init",
        label: "CLI",
        summary: "init, show, hide, toggle, auto, and remove",
        group: "Reference",
      },
      {
        id: "faq",
        label: "FAQ",
        summary: "Common questions and troubleshooting",
        group: "Reference",
      },
    ],
  },
];

// Preserving the old alias for any external import.
export const DOCS_NAV_GROUPS = VERCEL_DOCS_NAV_GROUPS;

/** The single source of truth for scrollspy, navigation, and search targets. */
export const DOCS_SECTION_IDS = VERCEL_DOCS_NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => item.id)
);

export interface AgentGuide {
  key: "opencode" | "claude" | "agy";
  id: string;
  name: string;
  summary: string;
  where: string;
  readMore: string;
  toggle: string;
  requires: string;
  notes: string[];
  setup?: {
    label: string;
    filename: string;
    language: string;
    code: string;
  };
}

export const AGENT_GUIDES: AgentGuide[] = [
  {
    key: "opencode",
    id: "agent-opencode",
    name: "OpenCode",
    summary: "Above-prompt card and a native /feed popup.",
    where:
      "The composer's top slot, directly above the prompt, while the agent executes.",
    readMore:
      "Type `/feed`. OpenCode's native popup handles search and scrolling; choose the Sources row to toggle channels.",
    toggle:
      "`Ctrl+O` hides or restores the card during a run. The dismissal lasts the current turn.",
    requires: "OpenCode with the v2 plugin API.",
    notes: [
      "The TUI renders from `cache.json`; it never fetches feeds itself.",
      "At idle, the prompt and footer stay completely untouched.",
      "A disabled channel is not contacted by the next fetch cycle.",
    ],
    setup: {
      label: "Manual plugin setup",
      filename: "opencode.jsonc",
      language: "json",
      code: `{
  "plugins": ["waitfeed"]
}`,
    },
  },
  {
    key: "claude",
    id: "agent-claude",
    name: "Claude Code",
    summary: "AbovePrompt band card and a /feed reader pane.",
    where:
      "Claude's `AbovePrompt` band, gated on the host's own `isWorking` state.",
    readMore:
      "Type `/feed` for a reader pane: ↑/↓ move, Enter opens and marks read, Esc closes.",
    toggle:
      "`Ctrl+N` toggles just the card mid-run. init binds it unless the key is already taken.",
    requires: "Claude Code v2.1.295 or later.",
    notes: [
      "The card disappears when the turn ends, when Claude waits on you, or when you press Esc.",
      "init stages the scheduler and mod into `~/.claude/waitfeed/` and writes the `SessionStart` hook.",
      "Re-running init prunes older WaitFeed statusline entries; foreign hooks stay untouched.",
    ],
  },
  {
    key: "agy",
    id: "agent-agy",
    name: "Antigravity",
    summary: "Statusline card for active agent states.",
    where:
      "The Antigravity statusline while `agent_state` is `working`, `tool_use`, or `reviewing`.",
    readMore:
      "Ctrl+Click a headline link to open it. On macOS, use Cmd+Click.",
    toggle:
      "AGY has no keybinding API. Run `npx waitfeed toggle` (or `hide` / `show` / `auto`) from any shell.",
    requires: "Google Antigravity with the `agy` statusline.",
    notes: [
      "Splash, idle, error, and unknown states print nothing.",
      "init stages the statusline bundle and points `~/.gemini/antigravity-cli/settings.json` at it.",
      "The card shares the same cache and channel settings as the other hosts.",
    ],
  },
];

export const BUILTIN_CHANNELS = [
  {
    badge: "HN",
    name: "Hacker News",
    description: "Top stories and discussions from news.ycombinator.com.",
    sourceUrl: "news.ycombinator.com",
  },
  {
    badge: "DEV",
    name: "Dev.to",
    description: "Practical posts, tutorials, and writeups from dev.to.",
    sourceUrl: "dev.to",
  },
  {
    badge: "GH",
    name: "GitHub Trending",
    description: "Repositories created in the last 7 days, ranked by stars.",
    sourceUrl: "github.com",
  },
  {
    badge: "REDDIT",
    name: "Reddit r/programming",
    description: "Community threads from reddit.com/r/programming.",
    sourceUrl: "reddit.com/r/programming",
  },
];

export interface ConfigOption {
  key: string;
  type: string;
  defaultValue: string;
  description: string;
}

export const CONFIG_OPTIONS: ConfigOption[] = [
  {
    key: "setupDone",
    type: "boolean",
    defaultValue: "false",
    description:
      "Onboarding flag. `init` writes `true`; OpenCode also sets it when it saves a channel switch.",
  },
  {
    key: "sources",
    type: "object",
    defaultValue: "all true",
    description: "Per-channel switches: `hn`, `devto`, `github`, `reddit`.",
  },
  {
    key: "rssUrls",
    type: "string[]",
    defaultValue: "[]",
    description: "RSS or Atom URLs. Values beyond 10 are ignored.",
  },
  {
    key: "dwellSeconds",
    type: "number",
    defaultValue: "20",
    description:
      "Seconds each card stays while the agent works. Clamped to 5–120.",
  },
  {
    key: "newsMode",
    type: '"auto" | "show" | "hide"',
    defaultValue: '"auto"',
    description:
      "Default visibility. `show` is a legacy alias of `auto`; nothing renders at idle.",
  },
  {
    key: "newsModes",
    type: "object (optional)",
    defaultValue: "—",
    description: "Per-host overrides: `opencode`, `claude`, `agy`.",
  },
];

export interface CliCommand {
  command: string;
  summary: string;
  note?: string;
}

export const CLI_COMMANDS: CliCommand[] = [
  {
    command: "npx waitfeed init",
    summary:
      "Detect installed hosts, choose agents and channels, stage integrations, and write config. Re-running is safe.",
    note: "With no command, the CLI also runs init.",
  },
  {
    command: "npx waitfeed show [host]",
    summary: "Restore the card: visible while the agent works.",
    note: "`show` is an alias of `auto`.",
  },
  {
    command: "npx waitfeed hide [host]",
    summary: "Force the card off, even mid-run.",
  },
  {
    command: "npx waitfeed toggle [host]",
    summary: "Flip between `hide` and `auto`.",
  },
  {
    command: "npx waitfeed auto [host]",
    summary: "Return to busy-only behavior.",
  },
  {
    command: "npx waitfeed remove",
    summary: "Remove integrations and delete `~/.config/waitfeed/`.",
    note: "`--keep-data` keeps settings and cache.",
  },
  {
    command: "npx waitfeed --version",
    summary: "Print the installed package version.",
  },
];

export interface LocalFile {
  path: string;
  role: string;
  detail: string;
  retention: string;
}

export const LOCAL_FILES_EXPLAINED: LocalFile[] = [
  {
    path: "~/.config/waitfeed/config.json",
    role: "Settings",
    detail: "Channels, RSS URLs, dwell time, and visibility modes.",
    retention: "Until removed",
  },
  {
    path: "~/.config/waitfeed/cache.json",
    role: "Story cache",
    detail: "Fetched items shared by every host.",
    retention: "90 items · 36 h",
  },
  {
    path: "~/.config/waitfeed/reader-state.json",
    role: "Reader history",
    detail: "`read` and `glanced` marks used to avoid repeats.",
    retention: "36 h",
  },
  {
    path: "~/.config/waitfeed/cycle.lock",
    role: "Fetch lock",
    detail: "Serializes fetch cycles across hosts.",
    retention: "Stolen after 10 min",
  },
];

export const BEGINNER_FAQS = [
  {
    q: "Why is no card showing?",
    a: "WaitFeed is quiet at idle. Start a task in your agent and give the first fetch a few seconds. If you previously ran `npx waitfeed hide`, run `npx waitfeed show` or `toggle`.",
  },
  {
    q: "Does it use tokens, API keys, or my code?",
    a: "No. There is no LLM call, no API key, and no telemetry. WaitFeed reads feed URLs and writes local files; it never reads your prompts or source files.",
  },
  {
    q: "Can I use it with more than one agent?",
    a: "Yes. All hosts share `~/.config/waitfeed/`. One fetch cycle fills the cache, and `cycle.lock` keeps concurrent hosts from racing.",
  },
  {
    q: "How do I add a blog or newsletter?",
    a: "Add up to 10 RSS or Atom URLs to `rssUrls`. The setup wizard accepts one URL; edit `config.json` for the rest. Custom items show the `RSS` badge.",
  },
  {
    q: "Can I hide one agent without hiding the others?",
    a: "Yes. `npx waitfeed hide claude` writes `newsModes.claude`; the other hosts keep their own mode.",
  },
  {
    q: "Can the card stay on at idle?",
    a: "No. `auto` and `show` only render while the agent is busy; `hide` forces it off. Every host is quiet when idle.",
  },
  {
    q: "What does remove delete?",
    a: "`npx waitfeed remove` removes WaitFeed's entries and staged files from each host, then deletes `~/.config/waitfeed/`. Add `--keep-data` to keep the data folder. Other plugins and hooks are untouched.",
  },
  {
    q: "What happens if config.json is invalid?",
    a: "Unknown keys and invalid values are ignored; missing values fall back to defaults. A hand-edited file cannot break the ticker.",
  },
];
