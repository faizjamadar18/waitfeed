"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BUILTIN_CHANNELS,
  LOCAL_FILES_EXPLAINED,
  SIMPLE_CLI_COMMANDS,
  BEGINNER_FAQS,
} from "@/data/docsData";
import { VercelCard, VercelCardGrid } from "./VercelDocsCards";
import { VercelCliTabs, VercelCodeBlock } from "./VercelCodeBlock";
import { VercelCallout } from "./VercelCallout";
import {
  AsciiWaitFeedBanner,
  HostAdapterInteractive,
} from "./VercelTerminalPreview";

interface DocsPageContentProps {
  onSelectSection: (id: string) => void;
}

function AmberQuickInstall() {
  const [copied, setCopied] = useState(false);
  const command = "npx waitfeed init";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 my-4">
      {/* Primary Amber Command Banner with High-Contrast Dark Text */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy npx waitfeed init command"
        className="w-full px-5 py-3.5 rounded-xl bg-[#fcaa2d] hover:bg-[#ffb547] text-neutral-950 font-mono font-bold text-sm sm:text-base tracking-wide flex items-center justify-between transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-[0.99] border-none outline-none group"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-neutral-950/70 select-none text-base">$</span>
          <span className="text-neutral-950 font-bold tracking-tight">{command}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs font-sans font-semibold text-neutral-950 bg-neutral-950/10 px-2.5 py-1 rounded-md group-hover:bg-neutral-950/15 transition-colors">
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 stroke-neutral-950"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8.5 6.5 12 13 4" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 stroke-neutral-950"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
                <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
              </svg>
              <span>Copy command</span>
            </>
          )}
        </span>
      </button>

      {/* Multi-Package Manager Switcher Tabs */}
      <VercelCliTabs command="waitfeed init" />
    </div>
  );
}

export function DocsPageContent({ onSelectSection }: DocsPageContentProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-8 space-y-16 text-neutral-200">
      {/* 1. Header & Overview Section */}
      <section id="overview" className="scroll-mt-24 space-y-5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-xs bg-amber-400" />
            <span>WAITFEED DOCUMENTATION</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider uppercase bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium">
              Free & Open Source
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider uppercase bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium">
              No API Keys Needed
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider uppercase bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium">
              2-Min Setup
            </span>
          </div>
        </div>

        {/* H1 Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
          Learn <span className="text-amber-400">WaitFeed</span> in minutes
        </h1>

        {/* Lead subtitle */}
        <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-3xl">
          Turn every agent idle turn into a tech briefing. Real-time engineering stories,
          trending repositories, and tech discussions stream directly into your terminal while
          OpenCode, Claude Code, or Antigravity executes tasks. Zero LLM tokens, zero API keys,
          and 100% local.
        </p>

        {/* Hero Code Box with Amber Action Banner */}
        <div className="pt-2">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            One-Command Installation
          </div>
          <AmberQuickInstall />
        </div>
      </section>

      {/* 2. Coding Agent Quick Cards */}
      <section id="agent-setup" className="scroll-mt-24 space-y-4">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-between">
            <span>Set up your coding agent</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Choose your AI agent to view host-specific hooks, keybindings, and display zones.
          </p>
        </div>

        <VercelCardGrid columns={3}>
          <VercelCard
            title="OpenCode"
            description="Above-prompt card plugin with fullscreen /feed reader. Rotates fresh stories every 20s and toggles with Ctrl+O."
            badge="TUI PLUGIN"
            href="#agent-opencode"
            onClick={() => onSelectSection("agent-opencode")}
            meta="0 tokens · Solid TUI"
            icon={
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                <path d="M5 7l2 2-2 2" />
                <line x1="9" y1="11" x2="11" y2="11" />
              </svg>
            }
          />

          <VercelCard
            title="Claude Code"
            description="Rides Claude's AbovePrompt band. Appears during tool execution and edits, and yields immediately on permission prompts."
            badge="BAND HOOK"
            href="#agent-claude"
            onClick={() => onSelectSection("agent-claude")}
            meta="AbovePrompt · /feed pane"
            icon={
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4 text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v6M5 8h6" />
              </svg>
            }
          />

          <VercelCard
            title="Antigravity (AGY)"
            description="Integrated statusline display for autonomous workflows. Syncs agent_state so your idle prompt remains 100% clean."
            badge="agent_state"
            href="#agent-agy"
            onClick={() => onSelectSection("agent-agy")}
            meta="Non-intrusive · Statusline"
            icon={
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="m11 5-6 6M11 11 5 5" />
              </svg>
            }
          />
        </VercelCardGrid>
      </section>

      {/* 3. Quickstart & Interactive Terminal */}
      <section id="quickstart" className="scroll-mt-24 space-y-6">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Quickstart
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Get WaitFeed running in under 60 seconds with three simple steps.
          </p>
        </div>

        <div className="space-y-6 text-sm">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-white">
                Run the setup wizard in your project or root terminal
              </h3>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                The setup wizard automatically detects installed coding agents (OpenCode, Claude Code, Antigravity)
                and stages the required adapter bundles idempotently.
              </p>
              <VercelCodeBlock code="npx waitfeed init" language="bash" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-white">
                Select your tech news channels & dwell timing
              </h3>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                Choose from Hacker News, GitHub Trending, Dev.to, Reddit, or input custom RSS/Atom feeds.
                Default card rotation is set to 20 seconds.
              </p>
              {/* ASCII Banner Preview */}
              <div className="rounded-lg border border-neutral-800 bg-[#0d0d10] p-4 text-center my-3">
                <div className="text-[11px] font-mono text-neutral-400 mb-2">
                  Live 3D Startup Banner from packages/waitfeed/bin.mjs
                </div>
                <AsciiWaitFeedBanner />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-white">
                Launch your agent and start coding
              </h3>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                WaitFeed stays completely silent while your prompt is idle. As soon as you ask your agent to build, test,
                or refactor code, headlines stream cleanly above your prompt or in the statusline.
              </p>
            </div>
          </div>
        </div>

        <VercelCallout type="tip" title="Non-blocking Guarantee">
          WaitFeed never swallows user keystrokes. Hide-on-type instantly clears the card whenever you touch a key,
          preserving 100% typing responsiveness and zero interference with command input.
        </VercelCallout>
      </section>

      {/* 4. Host Adapters Interactive Showcase */}
      <section id="agent-opencode" className="scroll-mt-24 space-y-4">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Supported Host Adapters
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Compare display zones, keyboard shortcuts, and live terminal states across all three supported hosts.
          </p>
        </div>

        <HostAdapterInteractive />
      </section>

      {/* 5. Zero-Token Architecture */}
      <section id="architecture" className="scroll-mt-24 space-y-6">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Zero-Token Architecture
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Architecture in one line: every adapter renders from the same local cache.
            Renders only read the cache; they never fetch or invoke an LLM.
          </p>
        </div>

        {/* Visual pipeline block */}
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-6 space-y-6">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
            Unified Data Pipeline
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-1">
              <span className="text-amber-300 font-bold">1. Remote Feeds</span>
              <span className="text-[11px] text-neutral-400">HN · GitHub · RSS</span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-1">
              <span className="text-blue-300 font-bold">2. Cycle Lock</span>
              <span className="text-[11px] text-neutral-400">cycle.lock (stale TTL)</span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-1">
              <span className="text-purple-300 font-bold">3. Local Cache</span>
              <span className="text-[11px] text-neutral-400">cache.json (36h)</span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-1">
              <span className="text-emerald-300 font-bold">4. Host Gate</span>
              <span className="text-[11px] text-neutral-400">Busy/Idle Detector</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            The shared fetch → enrich → junk-drop pipeline is serialized via file locks.
            Busy/idle gating is host-native (OpenCode session state, AGY <code className="text-amber-300 font-mono">agent_state</code>,
            and Claude Code&apos;s own <code className="text-amber-300 font-mono">isWorking</code> AbovePrompt property).
          </p>
        </div>

        <VercelCardGrid columns={3}>
          <VercelCard
            title="0 LLM Tokens"
            description="Pure HTTP RSS parsing with rss-parser. 0 tokens consumed, 0 API keys required, and 0 prompt overhead."
            badge="100% FREE"
          />
          <VercelCard
            title="36-Hour Local Cache"
            description="Stores up to 90 stories locally so cards paint in 0ms without network latency during coding."
            badge="cache.json"
          />
          <VercelCard
            title="Cross-Agent History"
            description="Tracks seen stories in reader-state.json so you never see the same headline twice across agents."
            badge="DEDUP"
          />
        </VercelCardGrid>
      </section>

      {/* 6. Built-in Channels & Custom RSS */}
      <section id="feeds-builtin" className="scroll-mt-24 space-y-6">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            News Channels & Custom RSS
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            WaitFeed bundles high-quality developer news sources and supports up to 10 custom RSS/Atom feeds.
          </p>
        </div>

        <VercelCardGrid columns={2}>
          {BUILTIN_CHANNELS.map((ch) => (
            <VercelCard
              key={ch.badge}
              title={ch.name}
              description={ch.whatYouGet}
              badge={ch.badge}
              meta={ch.feedUrl}
              icon={
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ch.color }}
                />
              }
            />
          ))}
        </VercelCardGrid>

        <div id="feeds-custom" className="scroll-mt-24 space-y-3 pt-2">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Adding Custom RSS & Atom Feeds
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300">
            Open <code className="text-amber-300 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">~/.config/waitfeed/config.json</code> and add your favorite blogs
            or feeds to the <code className="text-amber-300 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">&quot;rssUrls&quot;</code> array:
          </p>
          <VercelCodeBlock
            filename="~/.config/waitfeed/config.json"
            language="json"
            code={`{
  "channels": ["HN", "GH", "DEV", "REDDIT", "RSS"],
  "rssUrls": [
    "https://overreacted.io/rss.xml",
    "https://jvns.ca/atom.xml",
    "https://simonwillison.net/atom/everything/"
  ],
  "dwellSeconds": 20
}`}
          />
        </div>
      </section>

      {/* 7. Configuration Schema */}
      <section id="config-schema" className="scroll-mt-24 space-y-6">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Configuration Reference
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Complete schema for <code className="text-amber-300 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">~/.config/waitfeed/config.json</code>.
          </p>
        </div>

        {/* API Table */}
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/90 font-mono text-[11px] uppercase tracking-wider text-neutral-300">
              <tr>
                <th className="p-3.5 pl-5">Property</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Default</th>
                <th className="p-3.5 pr-5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 font-mono text-xs">
              <tr>
                <td className="p-3.5 pl-5 font-semibold text-amber-300">channels</td>
                <td className="p-3.5 text-neutral-400">string[]</td>
                <td className="p-3.5 text-neutral-300 font-mono bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-800 w-fit">[&quot;HN&quot;,&quot;GH&quot;,&quot;DEV&quot;]</td>
                <td className="p-3.5 pr-5 font-sans text-neutral-200">Enabled built-in channel identifiers.</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-5 font-semibold text-amber-300">rssUrls</td>
                <td className="p-3.5 text-neutral-400">string[]</td>
                <td className="p-3.5 text-neutral-300 font-mono bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-800 w-fit">[]</td>
                <td className="p-3.5 pr-5 font-sans text-neutral-200">Up to 10 valid RSS/Atom feed URLs.</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-5 font-semibold text-amber-300">dwellSeconds</td>
                <td className="p-3.5 text-neutral-400">number</td>
                <td className="p-3.5 text-neutral-300 font-mono bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-800 w-fit">20</td>
                <td className="p-3.5 pr-5 font-sans text-neutral-200">Seconds before rotating to the next unseen story.</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-5 font-semibold text-amber-300">hidden</td>
                <td className="p-3.5 text-neutral-400">Record&lt;string, boolean&gt;</td>
                <td className="p-3.5 text-neutral-300 font-mono bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-800 w-fit">&#123;&#125;</td>
                <td className="p-3.5 pr-5 font-sans text-neutral-200">Per-editor mute status (e.g. &#123; &quot;claude&quot;: true &#125;).</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Local Storage files */}
        <div id="config-storage" className="scroll-mt-24 space-y-3 pt-2">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Local Files & Storage Paths
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOCAL_FILES_EXPLAINED.map((file) => (
              <div
                key={file.path}
                className="p-4 rounded-lg border border-neutral-800 bg-[#0a0a0a] space-y-1.5"
              >
                <div className="font-mono text-xs font-semibold text-white">
                  {file.path}
                </div>
                <div className="text-[11px] font-mono text-amber-400">
                  {file.role}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                  {file.plainDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CLI Commands Reference */}
      <section id="cli-init" className="scroll-mt-24 space-y-6">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            CLI Commands Reference
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Run commands via <code className="text-amber-300 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">npx waitfeed [command]</code> or global binary.
          </p>
        </div>

        <div className="space-y-4">
          {SIMPLE_CLI_COMMANDS.map((cmd) => (
            <div
              key={cmd.command}
              className="p-5 rounded-xl border border-neutral-800 bg-[#0a0a0a] space-y-2 group hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <code className="text-sm font-mono font-bold text-amber-300">
                  {cmd.command}
                </code>
                <span className="text-[11px] font-mono text-neutral-400">
                  CLI Utility
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-200">
                {cmd.whatItDoes}
              </p>
              <div className="text-xs text-neutral-400 font-mono">
                When to use: {cmd.whenToUse}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Smart Visibility Guarantee */}
      <section id="smart-visibility" className="scroll-mt-24 space-y-4">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Smart Visibility & Non-blocking Guarantee
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Core engineering boundaries honored by every adapter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VercelCallout type="note" title="Never Swallows Keystrokes">
            Hide-on-type never intercepts user input. Typing in your terminal immediately yields focus to the agent prompt.
          </VercelCallout>

          <VercelCallout type="important" title="Keyless & Observational">
            WaitFeed never touches API keys, modifies agent prompts, or inspects source code. It only checks whether the host agent is busy or idle.
          </VercelCallout>
        </div>
      </section>

      {/* 10. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="scroll-mt-24 space-y-4">
        <div className="border-b border-neutral-800/80 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Troubleshooting & FAQ
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Quick answers to frequently asked questions about WaitFeed.
          </p>
        </div>

        <div className="space-y-3">
          {BEGINNER_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-neutral-900/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-white">
                    {faq.q}
                  </span>
                  <span
                    className={`shrink-0 w-5 h-5 rounded-md border border-neutral-700 flex items-center justify-center text-xs text-neutral-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-neutral-800 text-white" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-neutral-800/60 bg-neutral-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. Bottom Pager Navigation */}
      <div className="pt-8 border-t border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/"
          className="p-4 rounded-xl border border-neutral-800 bg-[#0a0a0a] hover:bg-[#121212] hover:border-neutral-700 transition-colors flex flex-col gap-1 text-left flex-1 min-w-[200px]"
        >
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            ← Home
          </span>
          <span className="text-sm font-semibold text-white">
            WaitFeed Product Landing
          </span>
        </Link>

        <a
          href="#quickstart"
          onClick={() => onSelectSection("quickstart")}
          className="p-4 rounded-xl border border-neutral-800 bg-[#0a0a0a] hover:bg-[#121212] hover:border-neutral-700 transition-colors flex flex-col gap-1 text-right flex-1 min-w-[200px]"
        >
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Next →
          </span>
          <span className="text-sm font-semibold text-white">
            Quickstart & Setup Wizard
          </span>
        </a>
      </div>
    </div>
  );
}
