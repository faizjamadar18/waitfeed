"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import {
  CLI_COMMANDS,
  CLAUDE_HOOKS,
  DOCS_NAV_GROUPS,
  FEED_SOURCES,
  FILESYSTEM_MAP,
  TEST_SUITES,
} from "@/data/docsData";
import { CopyCommandButton } from "@/components/CopyCommandButton";
import { CtaButton } from "@/components/CtaButton";
import { RELACE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  DocsCallout,
  DocsCodeBlock,
  DocsSectionHeader,
  DocsTable,
  InlineCode,
} from "./DocsPrimitives";
import {
  CardAnatomyDiagram,
  PipelineExplorer,
  VisibilityRulePlayground,
} from "./DocsInteractive";

const ALL_NAV_ITEMS = DOCS_NAV_GROUPS.flatMap((group) => group.items);

const SEARCH_KEYWORDS: Record<string, string> = {
  overview: "architecture principles cache.json readme fail-open observational repository layout",
  cli: "bin.mjs npx waitfeed init remove uninstall show hide toggle keep-data banner wizard",
  configuration: "config.json normalizeConfig sources dwellSeconds newsMode newsModes rssUrls CHANNEL_KEYS SOURCE_ALIASES",
  pipeline: "core/pipeline.ts runPipeline cycle.lock LOCK_TTL_MS REFRESH_MS_DEFAULT LOW_WATER_UNREAD retainMerge writeCacheDoc",
  feeds: "core/feeds.ts hackerNews devTo githubTrending redditTech rssChannel HN DEV GH REDDIT RSS",
  enrichment: "core/enrich.ts core/ticker.ts enrichMissing og:description dropNonEnglish isJunkTitle truncateSentence linkLabel formatDividerLine",
  ledger: "core/reader-state.ts reader-state.json read glanced seen upcoming groupItems rotation pinnedId",
  opencode: "opencode/index.ts opencode/tui.tsx opencode/turn-state.ts OpenTUI Solid jsxImportSource undici ctrl+o /feed slot",
  claude: "claude/src activity.ts flip.ts interrupt.ts watch.ts statusline-state.ts claude-mod register.js hooks COLUMNS Esc",
  agy: "core/agy.ts agy/src statusline.ts scheduler.ts agent_state agyDwellTick OSC 8 xterm-256",
  filesystem: "~/.config/waitfeed cache.json config.json reader-state.json cycle.lock claude-activity.json probe.log",
  development: "package.json esbuild vitest tsc pretest preview tests/ probe-feeds.mjs ci.yml",
  limits: "core/llm.ts isStoryable NEEDS_MORE StoryWriter privacy zero telemetry api keys",
};

export function DocsPageContent() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [query, setQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const matchingIds = useMemo(() => {
    if (!normalizedQuery) return null;
    const set = new Set<string>();
    for (const item of ALL_NAV_ITEMS) {
      const haystack = `${item.label} ${item.codeRef ?? ""} ${SEARCH_KEYWORDS[item.id] ?? ""}`.toLowerCase();
      if (haystack.includes(normalizedQuery)) {
        set.add(item.id);
      }
    }
    return set;
  }, [normalizedQuery]);

  // Keyboard shortcut: "/" focuses search, "Escape" clears it
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "/" && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Scroll-spy for left navigation rail
  useEffect(() => {
    const elements = ALL_NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-90px 0px -65% 0px",
        threshold: 0.05,
      }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function jumpTo(id: string) {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  return (
    <div className="w-full pb-24">
      {/* Editorial Docs Header */}
      <section className="w-full pt-12 sm:pt-16 pb-10 border-b border-[#e3e2d8]">
        <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: RELACE_EASE }}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.25 bg-[#fcaa2d] shrink-0" />
              <span className="font-decima text-[10px] leading-none tracking-[0.05em] uppercase text-[#a36404]">
                WaitFeed · Technical Reference · v1.2.0
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-decima text-[10px] uppercase tracking-wider text-[#191918]/55">
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                Node &gt;= 20
              </span>
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                0 API Keys
              </span>
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                3 Host Adapters
              </span>
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                MIT License
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: RELACE_EASE, delay: 0.05 }}
              className="flex flex-col gap-3 max-w-2xl"
            >
              <h1 className="text-4xl sm:text-5xl md:text-[52px] font-parabole font-normal leading-[1.06] tracking-[-0.04em] text-[#191918]">
                Complete{" "}
                <strong className="font-display font-normal text-black">
                  codebase
                </strong>{" "}
                documentation
              </h1>
              <p className="text-base sm:text-[17px] font-parabole leading-relaxed text-[#191918]/65">
                Every module, host adapter, cache contract, and lifecycle hook across{" "}
                <InlineCode>packages/waitfeed</InlineCode>—written directly from the
                source tree for contributors and curious engineers.
              </p>
            </motion.div>

            {/* Instant Docs Filter */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: RELACE_EASE, delay: 0.1 }}
              className="w-full lg:w-76 shrink-0 flex flex-col gap-2"
            >
              <label htmlFor="docs-filter" className="sr-only">
                Filter documentation sections
              </label>
              <div className="relative flex items-center">
                <input
                  id="docs-filter"
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter topics, files, hooks..."
                  className="w-full bg-[#f3f2e7] border border-[#e3e2d8] focus:border-[#fcaa2d] rounded-xs px-3.5 py-2.5 pr-14 text-sm font-parabole text-[#191918] placeholder:text-[#191918]/40 outline-none transition-colors"
                />
                <span className="absolute right-2.5 font-decima text-[10px] px-1.5 py-0.5 rounded-xs bg-[#fffef2] border border-[#e3e2d8] text-[#191918]/50">
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="cursor-pointer hover:text-[#191918]"
                    >
                      CLR
                    </button>
                  ) : (
                    "/"
                  )}
                </span>
              </div>
              {matchingIds && (
                <p className="font-decima text-[10px] uppercase tracking-wider text-[#a36404] m-0">
                  {matchingIds.size === 0
                    ? "No matching sections — try `cache`, `claude`, `rss`, or `cli`"
                    : `${matchingIds.size} matching ${matchingIds.size === 1 ? "section" : "sections"}`}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Documentation Grid */}
      <div className="max-w-266 mx-auto px-5 sm:px-10 pt-8 sm:pt-12 flex flex-col lg:flex-row items-start gap-10 lg:gap-12">
        {/* Mobile Section Switcher */}
        <div className="w-full lg:hidden sticky top-2 z-30 bg-[#fffef2]/95 backdrop-blur-xs border border-[#e3e2d8] rounded-xs p-2.5">
          <label
            htmlFor="mobile-docs-nav"
            className="block font-decima text-[10px] uppercase tracking-widest text-[#191918]/50 mb-1.5 px-1"
          >
            Jump to Section
          </label>
          <select
            id="mobile-docs-nav"
            value={activeSection}
            onChange={(e) => jumpTo(e.target.value)}
            className="w-full bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs px-3 py-2 text-sm font-parabole text-[#191918] outline-none"
          >
            {DOCS_NAV_GROUPS.map((group) => (
              <optgroup key={group.title} label={group.title}>
                {group.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Sticky Left Rail Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 sticky top-8 flex-col gap-6 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
          <nav aria-label="Documentation sections" className="flex flex-col gap-5">
            {DOCS_NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-1.5">
                <span className="font-decima text-[10px] uppercase tracking-[0.08em] text-[#191918]/45 px-2.5">
                  {group.title}
                </span>
                <ul className="list-none p-0 m-0 flex flex-col gap-0.5 border-l border-[#e3e2d8]">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    const isDimmed = matchingIds !== null && !matchingIds.has(item.id);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => jumpTo(item.id)}
                          className={cn(
                            "w-full text-left pl-3 pr-2 py-1.5 -ml-px border-l-2 text-[13px] font-parabole transition-all cursor-pointer flex items-center justify-between gap-2",
                            isActive
                              ? "border-[#fcaa2d] text-[#191918] font-medium bg-[#f3f2e7]/70"
                              : "border-transparent text-[#191918]/60 hover:text-[#191918] hover:border-[#191918]/25",
                            isDimmed && "opacity-35"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Quick Install Card in Sidebar */}
          <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/70 p-3.5 flex flex-col gap-2.5">
            <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
              Quick Install
            </span>
            <p className="text-xs font-parabole text-[#191918]/65 leading-relaxed m-0">
              Detects OpenCode, Claude Code, and Antigravity automatically.
            </p>
            <CopyCommandButton className="w-full justify-between px-3 py-2 text-[11px]" />
          </div>
        </aside>

        {/* Main Documentation Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-16">
          {/* 1. OVERVIEW */}
          <section
            id="overview"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("overview") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="overview"
              overline="01 · Getting Started"
              codeRef="README.md · AGENTS.md"
              title={
                <>
                  Overview &amp;{" "}
                  <strong className="font-display font-normal text-black">
                    architecture
                  </strong>{" "}
                  principles
                </>
              }
              description="WaitFeed turns dead terminal wait time while an AI coding agent executes into a calm, local-first tech briefing—then vanishes the instant the agent goes idle or asks for input."
            />

            <p className="text-[15px] font-parabole leading-relaxed text-[#191918]/80 m-0">
              Every host adapter in WaitFeed obeys one central invariant:{" "}
              <strong className="font-medium text-[#191918]">
                renders only read <InlineCode>~/.config/waitfeed/cache.json</InlineCode>; they never fetch over the network.
              </strong>{" "}
              A host-agnostic pipeline fetches feeds, enriches missing descriptions, filters junk and non-English items, and writes the cache atomically behind a cycle lock. Meanwhile, each host adapter tracks busy/idle state independently using that agent&apos;s native lifecycle primitives.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <DocsCallout title="Zero Tokens · Zero Keys" tone="amber">
                All three adapters run 100% locally with zero API keys, zero accounts, zero telemetry, and zero LLM token spend. The only outbound HTTP calls go directly to the feed channels you keep enabled.
              </DocsCallout>
              <DocsCallout title="Strictly Observational" tone="green">
                WaitFeed never swallows user keystrokes, never alters agent prompts or tool execution, and every hook exits <InlineCode>0</InlineCode> with fail-open degradation.
              </DocsCallout>
            </div>

            <DocsCodeBlock
              title="Monorepo & Shared Architecture"
              language="diagram"
              code={`Hacker News · Dev.to · GitHub Trending · Reddit · Custom RSS (<= 10)
    │
    │  fetch -> merge -> dropNonEnglish -> retainMerge (36h) -> enrich -> dropJunk
    │  serialized via ~/.config/waitfeed/cycle.lock (10m stale TTL)
    ▼
~/.config/waitfeed/cache.json        ◄── single source of truth
    │
    ├── packages/waitfeed/opencode/  OpenTUI Solid slot above composer + /feed popup + ctrl+o
    ├── packages/waitfeed/claude/    statusLine (COLUMNS - 4) + hook ledger + --wf flip + Esc watch
    ├── packages/waitfeed/claude-mod /feed sticky-cursor Pane (Claude Code v2.1.295+)
    └── packages/waitfeed/agy/       statusline from agent_state JSON + wall-clock dwell walk`}
            />

            <DocsTable
              headers={["Directory", "Role", "Key Entry Points"]}
              rows={[
                [
                  <InlineCode key="p-core">packages/waitfeed/core/</InlineCode>,
                  "Host-agnostic pipeline, config normalization, feed fetchers, enrichment, text filtering, reader ledger, and AGY/statusline layout math.",
                  <span key="e-core" className="font-mono text-xs text-[#191918]/70">
                    pipeline.ts · config.ts · feeds.ts · enrich.ts · ticker.ts · agy.ts · reader-state.ts
                  </span>,
                ],
                [
                  <InlineCode key="p-oc">packages/waitfeed/opencode/</InlineCode>,
                  "OpenCode v2 server plugin (30s pipeline poll) and OpenTUI Solid plugin (Slot A card, Slot B status pill, /feed dialog).",
                  <span key="e-oc" className="font-mono text-xs text-[#191918]/70">
                    index.ts · tui.tsx · turn-state.ts · reader-state.ts
                  </span>,
                ],
                [
                  <InlineCode key="p-cl">packages/waitfeed/claude/ &amp; claude-mod/</InlineCode>,
                  "Bundled Node runners for Claude Code statusLine & hooks plus the native /feed reader Pane mod.",
                  <span key="e-cl" className="font-mono text-xs text-[#191918]/70">
                    statusline.ts · scheduler.ts · activity.ts · flip.ts · interrupt.ts · register.js
                  </span>,
                ],
                [
                  <InlineCode key="p-ag">packages/waitfeed/agy/</InlineCode>,
                  "Bundled Antigravity CLI (agy) statusline and SessionStart scheduler runners.",
                  <span key="e-ag" className="font-mono text-xs text-[#191918]/70">
                    src/statusline.ts · src/scheduler.ts · plugin.json · hooks.json
                  </span>,
                ],
                [
                  <InlineCode key="p-bin">packages/waitfeed/bin.mjs</InlineCode>,
                  "CLI wizard (init, remove, show, hide, auto, toggle) shipping as the waitfeed npm bin.",
                  <span key="e-bin" className="font-mono text-xs text-[#191918]/70">
                    npx waitfeed init | remove | toggle
                  </span>,
                ],
              ]}
            />
          </section>

          {/* 2. CLI & SETUP WIZARD */}
          <section
            id="cli"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("cli") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="cli"
              overline="02 · CLI & Onboarding"
              codeRef="packages/waitfeed/bin.mjs"
              title={
                <>
                  CLI &amp;{" "}
                  <strong className="font-display font-normal text-black">
                    idempotent
                  </strong>{" "}
                  setup wizard
                </>
              }
              description="Zero-config installation and surgical teardown across OpenCode, Claude Code, and Google Antigravity."
            />

            <p className="text-[15px] font-parabole leading-relaxed text-[#191918]/80 m-0">
              Running <InlineCode>npx waitfeed init</InlineCode> renders a 24-bit gradient banner (automatically adapting to narrow <InlineCode>&lt;66</InlineCode> column terminals, <InlineCode>NO_COLOR</InlineCode>, or <InlineCode>TERM=dumb</InlineCode>), probes your <InlineCode>PATH</InlineCode> and home directories for installed agents, and runs raw-TTY multi-select prompts for agents, channels, and an optional custom RSS URL.
            </p>

            <DocsTable
              headers={["Command", "Aliases / Args", "Behavior"]}
              rows={CLI_COMMANDS.map((row) => [
                <InlineCode key={row.cmd}>{row.cmd}</InlineCode>,
                <span key={row.alias} className="font-mono text-xs text-[#191918]/65">
                  {row.alias}
                </span>,
                row.effect,
              ])}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocsCodeBlock
                title="Host Detection & Registration"
                language="text"
                code={`OpenCode     ~/.config/opencode/opencode.json(c)
             Adds "waitfeed" to plugins[] (JSONC comment safe)

Antigravity  ~/.gemini/config/plugins/waitfeed/dist/*.mjs
             Writes statusLine in ~/.gemini/antigravity-cli/settings.json

Claude Code  ~/.claude/waitfeed/dist/*.mjs + claude-mod/
             Writes statusLine (refreshInterval: 2), 14 hooks,
             and env.CLAUDE_CODE_PLUGIN_DIRS in ~/.claude/settings.json`}
              />
              <DocsCodeBlock
                title="Quick Commands"
                language="bash"
                code={`# Run interactive setup wizard
npx waitfeed init

# Temporarily hide or toggle cards mid-run
npx waitfeed hide
npx waitfeed toggle claude

# Cleanly remove all integrations & ~/.config/waitfeed
npx waitfeed remove
npx waitfeed remove --keep-data`}
              />
            </div>

            <DocsCallout title="Safe Teardown Guarantee" tone="ink">
              <InlineCode>removeOpenCodePlugin</InlineCode>, <InlineCode>removeAgyPlugin</InlineCode>, and <InlineCode>removeClaudePlugin</InlineCode> never overwrite unparseable JSON configs and only strip entries whose paths match WaitFeed&apos;s own staged directories. Foreign statuslines, hooks, and <InlineCode>CLAUDE_CODE_PLUGIN_DIRS</InlineCode> entries always survive untouched.
            </DocsCallout>
          </section>

          {/* 3. CONFIGURATION */}
          <section
            id="configuration"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("configuration") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="configuration"
              overline="03 · Configuration"
              codeRef="packages/waitfeed/core/config.ts"
              title={
                <>
                  Shared{" "}
                  <strong className="font-display font-normal text-black">
                    config.json
                  </strong>{" "}
                  schema &amp; visibility rules
                </>
              }
              description="One small file at ~/.config/waitfeed/config.json governs every host adapter. Invalid or half-written edits fall back gracefully through normalizeConfig()."
            />

            <DocsCodeBlock
              title="~/.config/waitfeed/config.json"
              language="json"
              code={`{
  "setupDone": true,
  "sources": {
    "hn": true,
    "devto": true,
    "github": true,
    "reddit": true
  },
  "rssUrls": [
    "https://simonwillison.net/atom/everything/"
  ],
  "dwellSeconds": 20,
  "newsMode": "auto",
  "newsModes": {
    "opencode": "auto",
    "claude": "auto",
    "agy": "hide"
  }
}`}
            />

            <DocsTable
              headers={["Key", "Type / Bounds", "Default", "Details"]}
              rows={[
                [
                  <InlineCode key="k-src">sources</InlineCode>,
                  <span key="t-src" className="font-mono text-xs">Record&lt;ChannelKey, boolean&gt;</span>,
                  "all true",
                  "Per-channel switches for hn, devto, github, reddit. Disabled channels are skipped during both fetch and render.",
                ],
                [
                  <InlineCode key="k-rss">rssUrls</InlineCode>,
                  <span key="t-rss" className="font-mono text-xs">string[] (max 10)</span>,
                  "[]",
                  "Custom RSS/Atom feed URLs; trimmed, empty entries dropped, always active with an RSS badge.",
                ],
                [
                  <InlineCode key="k-dw">dwellSeconds</InlineCode>,
                  <span key="t-dw" className="font-mono text-xs">5 – 120 (int)</span>,
                  "20",
                  "Card hold duration during active runs. Clamped between DWELL_MIN (5) and DWELL_MAX (120) so typos never strobe or freeze.",
                ],
                [
                  <InlineCode key="k-nm">newsMode / newsModes</InlineCode>,
                  <span key="t-nm" className="font-mono text-xs">&quot;auto&quot; | &quot;hide&quot; | &quot;show&quot;</span>,
                  "&quot;auto&quot;",
                  "Per-host overrides (opencode, claude, agy) via getHostNewsMode() with fallback to newsMode. \"show\" is a legacy alias of \"auto\" and never pins cards at idle.",
                ],
                [
                  <InlineCode key="k-sd">setupDone</InlineCode>,
                  <span key="t-sd" className="font-mono text-xs">boolean</span>,
                  "false",
                  "Set true on init or first source toggle inside OpenCode.",
                ],
              ]}
            />

            <VisibilityRulePlayground />
          </section>

          {/* 4. SHARED DATA PIPELINE */}
          <section
            id="pipeline"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("pipeline") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="pipeline"
              overline="04 · Core Engine"
              codeRef="packages/waitfeed/core/pipeline.ts"
              title={
                <>
                  Shared{" "}
                  <strong className="font-display font-normal text-black">
                    fetch → enrich → cache
                  </strong>{" "}
                  pipeline
                </>
              }
              description="Every adapter invokes runPipeline(deps) with its own logger or scheduler, serialized across processes via cycle.lock and written atomically to cache.json."
            />

            <PipelineExplorer />

            <DocsCallout title="Low-Water Refill & Concurrent Hosts" tone="amber">
              Because OpenCode checks every 30 seconds while Claude and AGY run at <InlineCode>SessionStart</InlineCode>, <InlineCode>runPipeline()</InlineCode> skips redundant fetches if <InlineCode>cache.json</InlineCode> is under 30 minutes old—unless <InlineCode>countUnread()</InlineCode> finds fewer than 5 unseen items AND at least 60 seconds have passed since <InlineCode>fetchedAt</InlineCode>.
            </DocsCallout>
          </section>

          {/* 5. FEED CHANNELS */}
          <section
            id="feeds"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("feeds") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="feeds"
              overline="05 · Core Engine"
              codeRef="packages/waitfeed/core/feeds.ts"
              title={
                <>
                  Keyless{" "}
                  <strong className="font-display font-normal text-black">
                    developer feed
                  </strong>{" "}
                  channels
                </>
              }
              description="Four built-in developer channels plus up to ten user-supplied RSS/Atom feeds, all fetched defensively via Promise.allSettled with a 10-second timeout."
            />

            <DocsTable
              headers={["Badge", "Hex / xterm-256", "Upstream Endpoint", "Limit & Behavior"]}
              rows={FEED_SOURCES.map((src) => [
                <span
                  key={src.key}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2 py-0.5 rounded-xs text-[#0A0A0C]"
                  style={{ backgroundColor: src.colorHex }}
                >
                  {src.badge}
                </span>,
                <span key={`${src.key}-c`} className="font-mono text-xs text-[#191918]/75 whitespace-nowrap">
                  {src.colorHex} · {src.ansi}
                </span>,
                <span key={`${src.key}-u`} className="font-mono text-[11px] break-all text-[#191918]/80">
                  {src.endpoint}
                </span>,
                <span key={`${src.key}-n`} className="text-xs leading-relaxed">
                  <strong className="font-medium text-[#191918]">{src.fetchLimit}.</strong>{" "}
                  {src.notes}
                </span>,
              ])}
            />

            <DocsCallout title="Source Alias Normalization" tone="ink">
              Reddit items are persisted with <InlineCode>source: &quot;R/PROG&quot;</InlineCode> while configuration uses key <InlineCode>reddit</InlineCode> and badge <InlineCode>REDDIT</InlineCode>. <InlineCode>channelForSource()</InlineCode> maps both <InlineCode>&quot;R/PROG&quot;</InlineCode> and <InlineCode>&quot;REDDIT&quot;</InlineCode> via <InlineCode>SOURCE_ALIASES</InlineCode> so toggles stay consistent across every UI.
            </DocsCallout>
          </section>

          {/* 6. ENRICHMENT & FILTERING */}
          <section
            id="enrichment"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("enrichment") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="enrichment"
              overline="06 · Core Engine"
              codeRef="core/enrich.ts · core/ticker.ts"
              title={
                <>
                  Enrichment,{" "}
                  <strong className="font-display font-normal text-black">
                    noise filtering
                  </strong>{" "}
                  &amp; typography
                </>
              }
              description="Pure formatting and filtering helpers ensure cards stay readable, English-only, sentence-complete, and strictly bounded inside terminal width."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-2.5">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  Meta Description Enricher
                </span>
                <ul className="text-[13.5px] font-parabole text-[#191918]/80 space-y-1.5 list-none p-0 m-0">
                  <li>
                    • Targets items missing <InlineCode>context</InlineCode>, skipping <InlineCode>news.ycombinator.com</InlineCode> and <InlineCode>reddit.com</InlineCode>.
                  </li>
                  <li>
                    • Fetches in batches of <InlineCode>8</InlineCode>, capped at <InlineCode>24</InlineCode> pages/cycle (<InlineCode>8s</InlineCode> timeout, <InlineCode>300 KB</InlineCode> HTML slice).
                  </li>
                  <li>
                    • Extracts <InlineCode>og:description</InlineCode> or <InlineCode>meta[name=description]</InlineCode>, decodes entities, and rejects echoes via <InlineCode>isContextDuplicate()</InlineCode>.
                  </li>
                </ul>
              </div>

              <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-2.5">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  Pure Ticker Guarantees
                </span>
                <ul className="text-[13.5px] font-parabole text-[#191918]/80 space-y-1.5 list-none p-0 m-0">
                  <li>
                    • <InlineCode>dropNonEnglish()</InlineCode> strips Cyrillic, Arabic, Hebrew, Indic, Thai, Hangul, Kana, and Han scripts prior to enrichment.
                  </li>
                  <li>
                    • <InlineCode>isJunkTitle()</InlineCode> drops bare single-token slugs while keeping <InlineCode>owner/repo</InlineCode> names.
                  </li>
                  <li>
                    • <InlineCode>truncateSentence()</InlineCode> cuts at real sentence terminators (ignoring lowercase abbreviations like <InlineCode>e.g.</InlineCode>).
                  </li>
                </ul>
              </div>
            </div>

            <DocsCodeBlock
              title="Responsive Divider & Link Label Behavior (core/ticker.ts)"
              language="text"
              code={`formatDividerLine(width, count, open, key, "/feed"):
  wide         ─── ↑ 12 new reads ─────────────── ctrl+o open · /feed all ───
  wide (no cmd)─── ↑ 12 new reads ─────────────────────────── ctrl+o open ───
  medium       ─ ↑ 12 new ──────────────────────────────────────── ctrl+o ─
  narrow       ↑ 12 new                                              ctrl+o
  very-narrow  ↑ 12

linkLabel("https://github.com/morluto/esp32-iphone-agent", 34)
  => "github.com/…/esp32-iphone-agent"`}
            />
          </section>

          {/* 7. READER LEDGER & ROTATION */}
          <section
            id="ledger"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("ledger") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="ledger"
              overline="07 · Core Engine"
              codeRef="packages/waitfeed/core/reader-state.ts"
              title={
                <>
                  Reader{" "}
                  <strong className="font-display font-normal text-black">
                    SEEN / UPCOMING
                  </strong>{" "}
                  ledger &amp; rotation
                </>
              }
              description="Tracks only provable actions—full dwells (glanced) and explicit link opens (read)—inside ~/.config/waitfeed/reader-state.json."
            />

            <p className="text-[15px] font-parabole leading-relaxed text-[#191918]/80 m-0">
              Both <InlineCode>opencode/tui.tsx</InlineCode> and <InlineCode>claude-mod/hooks/register.js</InlineCode> share the same ledger format. Items are keyed by <InlineCode>itemKey(it)</InlineCode> (<InlineCode>(url || id).trim().toLowerCase()</InlineCode>) and pruned alongside the 36-hour cache TTL (<InlineCode>MAX_AGE_MS</InlineCode>). <InlineCode>groupItems()</InlineCode> derives <InlineCode>seen</InlineCode> (sorted by latest mark timestamp) and <InlineCode>upcoming</InlineCode> (newest-first) dynamically on read.
            </p>

            <DocsTable
              headers={["Mark Kind", "Recorded When", "Persistence", "UI Treatment"]}
              rows={[
                [
                  <InlineCode key="m-read">read</InlineCode>,
                  "User presses Enter / clicks a headline in /feed.",
                  "Immediate atomic tmp+rename save (OpenCode) or read-modify-write via $.fs.write (Claude Mod).",
                  "Shows \"read 3m\" age footer in /feed and moves item to SEEN.",
                ],
                [
                  <InlineCode key="m-glanced">glanced</InlineCode>,
                  "Card completes a full dwell window on the OpenCode ticker.",
                  "Batched behind a 2,000 ms debounce (GLANCE_SAVE_DELAY_MS) to avoid per-card disk churn.",
                  "Moves item to SEEN without printing an auto \"glanced\" badge.",
                ],
              ]}
            />
          </section>

          {/* 8. OPENCODE ADAPTER */}
          <section
            id="opencode"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("opencode") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="opencode"
              overline="08 · Host Adapter"
              codeRef="packages/waitfeed/opencode/"
              title={
                <>
                  OpenCode{" "}
                  <strong className="font-display font-normal text-black">
                    TUI &amp; server
                  </strong>{" "}
                  plugin
                </>
              }
              description="WaitFeed's native home: a background v2 server plugin plus an OpenTUI Solid plugin rendering above the composer and inside /feed."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-4 flex flex-col gap-2">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  Server Plugin · opencode/index.ts
                </span>
                <p className="text-[13.5px] font-parabole text-[#191918]/75 leading-relaxed m-0">
                  Runs <InlineCode>runPipeline()</InlineCode> once at startup and schedules a 30-second check interval (<InlineCode>CHECK_MS</InlineCode>). Because OpenCode re-runs <InlineCode>setup()</InlineCode> per active session, <InlineCode>cycle.lock</InlineCode> prevents duplicate fetches.
                </p>
              </div>
              <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-4 flex flex-col gap-2">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  TUI Plugin · opencode/tui.tsx
                </span>
                <p className="text-[13.5px] font-parabole text-[#191918]/75 leading-relaxed m-0">
                  Polls <InlineCode>cache.json</InlineCode> every <InlineCode>5,000 ms</InlineCode>, pins <InlineCode>pinnedId</InlineCode> for the full <InlineCode>dwellSeconds</InlineCode> window (no-repeat back-of-line queue), and renders Slot A (<InlineCode>session.composer.top</InlineCode>) + Slot B (<InlineCode>prompt.footer.status</InlineCode>).
                </p>
              </div>
            </div>

            <DocsCodeBlock
              title="Per-Session Turn & Keymap Isolation (opencode/turn-state.ts & tui.tsx)"
              language="typescript"
              code={`// 1. Line 1 of tui.tsx MUST stay /* @jsxImportSource @opentui/solid */
//    so consumer installs without a repo tsconfig never default to React.

// 2. Pure session maps keep background sub-agents from bleeding across tabs:
//    turnActiveMap[sessionID]    -> true on user inbox / execution.started
//    turnDismissedMap[sessionID] -> preserves Ctrl+O dismissal for the rest of the turn
//    waitingOnUser(sessionID)    -> yields automatically when permission.list or form.list > 0

// 3. Global keymap layer (priority: 10):
//    /feed  -> opens native xlarge select popup ([Sources] toggle submenu + SEEN / UPCOMING)
//    ctrl+o -> toggles card mid-run (disabled when session is idle)`}
            />

            <DocsCallout title="Node 20 Compatibility Invariant" tone="amber">
              OpenCode runs Node 20 while <InlineCode>@effect/platform-node</InlineCode> pulls <InlineCode>undici@8</InlineCode> (which requires Node &gt;= 22 and causes silent plugin load failures). <InlineCode>packages/waitfeed/package.json</InlineCode> pins <InlineCode>&quot;overrides&quot;: &#123; &quot;undici&quot;: &quot;6.29.1&quot; &#125;</InlineCode> installed with <InlineCode>--legacy-peer-deps</InlineCode>.
            </DocsCallout>
          </section>

          {/* 9. CLAUDE CODE + MOD */}
          <section
            id="claude"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("claude") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="claude"
              overline="09 · Host Adapter"
              codeRef="packages/waitfeed/claude/ & claude-mod/"
              title={
                <>
                  Claude Code{" "}
                  <strong className="font-display font-normal text-black">
                    hooks, instant flip
                  </strong>{" "}
                  &amp; /feed mod
                </>
              }
              description="Solves two host constraints cleanly: Claude Code's statusLine payload omits width/busy flags and fires no hook on Esc interrupts."
            />

            <p className="text-[15px] font-parabole leading-relaxed text-[#191918]/80 m-0">
              Because Claude Code captures statusline stdout inside a field roughly 3 columns narrower than <InlineCode>COLUMNS</InlineCode> and truncates overflow with <InlineCode>…</InlineCode>, <InlineCode>statusline-state.ts</InlineCode> subtracts <InlineCode>CLAUDE_STATUSLINE_MARGIN = 4</InlineCode> from detected columns. Activity state comes from a per-session ledger (<InlineCode>claude-activity.json</InlineCode>, 15-minute busy staleness) driven by 12 hook registrations:
            </p>

            <DocsTable
              headers={["Hook Event", "Scheduler Flag", "Exec", "Purpose"]}
              rows={CLAUDE_HOOKS.map((h) => [
                <InlineCode key={h.event}>{h.event}</InlineCode>,
                <span key={`${h.event}-f`} className="font-mono text-xs text-[#a36404]">
                  {h.flags}
                </span>,
                <span key={`${h.event}-m`} className="font-decima text-[10px] uppercase text-[#191918]/65">
                  {h.mode}
                </span>,
                h.purpose,
              ])}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocsCallout title="Instant-Paint Command Flip (flip.ts)" tone="amber">
                Claude Code re-runs <InlineCode>statusLine</InlineCode> immediately (skipping its 300 ms debounce) whenever <InlineCode>statusLine.command</InlineCode> changes in <InlineCode>settings.json</InlineCode>. On real <InlineCode>busy ↔ idle</InlineCode> transitions, WaitFeed toggles an inert <InlineCode> --wf</InlineCode> suffix so cards appear/disappear within milliseconds.
              </DocsCallout>
              <DocsCallout title="3-Layer Esc Interrupt Detection" tone="green">
                1) <InlineCode>SessionStart --watch</InlineCode> registers <InlineCode>watchPaths</InlineCode> on the transcript so <InlineCode>FileChanged --interrupt-check</InlineCode> fires on Esc. 2) Statusline self-heals via backward 128 KB tail scan for <InlineCode>[Request interrupted by user</InlineCode>. 3) Timestamp guard (<InlineCode>mark.at &gt; info.at</InlineCode>) protects fast re-prompts.
              </DocsCallout>
            </div>

            <DocsCodeBlock
              title="Claude Mod Sticky-Cursor /feed Pane (claude-mod/hooks/register.js)"
              language="javascript"
              code={`// Requires Claude Code v2.1.295+ (loaded via CLAUDE_CODE_PLUGIN_DIRS)
// Static-analysis compliant: string-literal event names, no Node imports, uses $ APIs only.

on('command.run', { command: 'feed' }, async ($) => {
  await $.ui.open({ id: 'waitfeed', title: 'WaitFeed — feed', focus: true, closeOnEscape: true })
  return {}
})

// Consumes ui.scroll (±1 arrow / wheel) -> moves $.ui.focus() + $.ui.scroll({ block: 'nearest' })
// PageUp / PageDown / Home / End pass straight through via next(e)`}
            />
          </section>

          {/* 10. ANTIGRAVITY (AGY) */}
          <section
            id="agy"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("agy") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="agy"
              overline="10 · Host Adapter"
              codeRef="packages/waitfeed/core/agy.ts & agy/src/"
              title={
                <>
                  Google{" "}
                  <strong className="font-display font-normal text-black">
                    Antigravity (AGY)
                  </strong>{" "}
                  statusline
                </>
              }
              description="Pure wall-clock dwell rendering from AGY's piped agent_state JSON payload—shared as the layout engine for both AGY and Claude Code."
            />

            <p className="text-[15px] font-parabole leading-relaxed text-[#191918]/80 m-0">
              AGY invokes <InlineCode>agy/dist/statusline.mjs</InlineCode> whenever state shifts, piping <InlineCode>&#123; agent_state, terminal_width &#125;</InlineCode> to stdin. Only <InlineCode>working</InlineCode>, <InlineCode>tool_use</InlineCode>, and <InlineCode>reviewing</InlineCode> activate the card; <InlineCode>idle</InlineCode>, startup, auth, error, or missing payloads print nothing and freeze <InlineCode>agyDwellTick()</InlineCode> so cards are never skipped while you read.
            </p>

            <CardAnatomyDiagram />
          </section>

          {/* 11. FILESYSTEM MAP */}
          <section
            id="filesystem"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("filesystem") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="filesystem"
              overline="11 · Internals"
              codeRef="~/.config/waitfeed/"
              title={
                <>
                  Local{" "}
                  <strong className="font-display font-normal text-black">
                    filesystem
                  </strong>{" "}
                  state map
                </>
              }
              description="All runtime state is anchored strictly to homedir()/.config/waitfeed/—never process.cwd() or __dirname—so consumer installs behave identically from any project folder."
            />

            <DocsTable
              headers={["File Path", "Owner", "Purpose"]}
              rows={FILESYSTEM_MAP.map((f) => [
                <InlineCode key={f.path} className="whitespace-nowrap">{f.path}</InlineCode>,
                <span key={`${f.path}-o`} className="font-mono text-xs text-[#191918]/70 whitespace-nowrap">
                  {f.owner}
                </span>,
                f.purpose,
              ])}
            />
          </section>

          {/* 12. MONOREPO, BUILD & TESTS */}
          <section
            id="development"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("development") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="development"
              overline="12 · Contributing"
              codeRef="package.json · tests/ · .github/workflows/ci.yml"
              title={
                <>
                  Monorepo{" "}
                  <strong className="font-display font-normal text-black">
                    build, bundles
                  </strong>{" "}
                  &amp; test contracts
                </>
              }
              description="The root package.json is a private waitfeed-dev harness running TypeScript, esbuild, and 11 Vitest suites against the built self-contained bundles."
            />

            <DocsCodeBlock
              title="Local Development Workflow"
              language="bash"
              code={`# 1. Install dev harness (vitest, tsc, esbuild) and package runtime tree
npm ci
npm --prefix packages/waitfeed install --legacy-peer-deps

# 2. Typecheck across packages + tests, build bundles, and run all 11 suites
npm run typecheck
npm test

# 3. Probe upstream feed channel health or preview the exact npm tarball
node scripts/probe-feeds.mjs
npm run preview`}
            />

            <DocsTable
              headers={["Test Suite", "Verified Contract"]}
              rows={TEST_SUITES.map((t) => [
                <InlineCode key={t.file} className="whitespace-nowrap">{t.file}</InlineCode>,
                t.focus,
              ])}
            />
          </section>

          {/* 13. HONEST LIMITS & PRIVACY */}
          <section
            id="limits"
            className={cn(
              "scroll-mt-10 flex flex-col gap-6",
              matchingIds && !matchingIds.has("limits") && "opacity-40"
            )}
          >
            <DocsSectionHeader
              id="limits"
              overline="13 · Guarantees"
              codeRef="packages/waitfeed/core/llm.ts"
              title={
                <>
                  Honest limits &amp;{" "}
                  <strong className="font-display font-normal text-black">
                    privacy
                  </strong>{" "}
                  contract
                </>
              }
              description="Clear boundaries around what WaitFeed refuses to fake, how core/llm.ts guards story integrity, and what leaves your machine."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocsCallout title="No Fabricated Fillers" tone="amber">
                Items with thin or missing descriptions simply omit body rows rather than padding fake summaries. First-run cold starts stay empty for a few seconds until the initial fetch lands, and <InlineCode>core/llm.ts</InlineCode> enforces a two-door rule (<InlineCode>isStoryable</InlineCode> &ge; 80 chars + <InlineCode>NEEDS_MORE</InlineCode> handshake) whenever a host enables <InlineCode>StoryWriter</InlineCode>.
              </DocsCallout>
              <DocsCallout title="Zero Telemetry & Network Scope" tone="green">
                WaitFeed runs no backend server and collects zero analytics. Network traffic is strictly limited to enabled feed URLs (30-minute baseline, or 60-second-rate-limited low-water refill) and HTML meta extraction on linked articles.
              </DocsCallout>
            </div>

            {/* Bottom CTA Strip */}
            <div className="mt-4 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex flex-col gap-1.5">
                <span className="font-decima text-[10px] uppercase tracking-widest text-[#a36404]">
                  Ready to try it?
                </span>
                <h3 className="text-xl font-parabole font-medium text-[#191918] tracking-tight m-0">
                  Run <InlineCode>npx waitfeed init</InlineCode> or inspect the source
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <CtaButton
                  href="/"
                  variant="beige"
                  showArrow
                  className="py-2.5! px-4! text-[11px]! uppercase tracking-wider"
                >
                  Back Home
                </CtaButton>
                <CtaButton
                  href="https://github.com/faizjamadar18/waitfeed"
                  target="_blank"
                  variant="accent"
                  showArrow
                  className="py-2.5! px-4! text-[11px]! uppercase tracking-wider"
                >
                  GitHub Repo
                </CtaButton>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

