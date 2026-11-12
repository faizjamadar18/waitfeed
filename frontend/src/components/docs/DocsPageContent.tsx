"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import {
  BEGINNER_FAQS,
  BUILTIN_CHANNELS,
  DOCS_NAV_GROUPS,
  LOCAL_FILES_EXPLAINED,
  SIMPLE_CLI_COMMANDS,
} from "@/data/docsData";
import { CopyCommandButton } from "@/components/CopyCommandButton";
import { CtaButton } from "@/components/CtaButton";
import { RELACE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  DocsCallout,
  DocsSectionHeader,
  DocsTable,
  InlineCode,
  StepList,
  TerminalCommand,
  TerminalWindow,
} from "./DocsPrimitives";
import {
  EditorGuideTabs,
  SetupBannerPreview,
  SmartVisibilityDemo,
} from "./DocsInteractive";

const ALL_NAV_ITEMS = DOCS_NAV_GROUPS.flatMap((group) => group.items);

const SEARCH_KEYWORDS: Record<string, string> = {
  introduction: "overview what is waitfeed opencode claude antigravity tech news zero tokens",
  quickstart: "install setup npx waitfeed init banner wizard ascii",
  editors: "opencode claude code antigravity agy ctrl+o ctrl+n /feed band shortcuts",
  feeds: "hacker news github dev.to reddit rss custom feeds dwellSeconds speed",
  commands: "cli init hide show toggle remove uninstall --keep-data",
  visibility: "busy idle working typing permission hide auto",
  privacy: "privacy local files ~/.config/waitfeed config.json cache.json api keys",
  faq: "help troubleshooting nothing showing add blog hide one editor uninstall",
};

const CONFIG_EXAMPLE = `{
  "sources": {
    "hn": true,
    "github": true,
    "devto": true,
    "reddit": true
  },
  "rssUrls": [
    "https://overreacted.io/rss.xml",
    "https://simonwillison.net/atom/everything/"
  ],
  "dwellSeconds": 20
}`;

export function DocsPageContent() {
  const [activeSection, setActiveSection] = useState<string>("introduction");
  const [query, setQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const matchingIds = useMemo(() => {
    if (!normalizedQuery) return null;
    const set = new Set<string>();
    for (const item of ALL_NAV_ITEMS) {
      const haystack = `${item.label} ${item.summary} ${SEARCH_KEYWORDS[item.id] ?? ""}`.toLowerCase();
      if (haystack.includes(normalizedQuery)) {
        set.add(item.id);
      }
    }
    return set;
  }, [normalizedQuery]);

  // Press "/" to focus filter box, "Escape" to clear
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

  // Scroll-spy for left navigation and right table of contents
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
      {/* Clean Editorial Header — exact max-w-266 alignment with Navbar & Landing */}
      <section className="w-full pt-12 sm:pt-16">
        <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-6 pb-10 border-b border-[#e3e2d8]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: RELACE_EASE }}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 bg-[#fcaa2d] shrink-0" />
              <span className="font-decima text-[10px] leading-none tracking-[0.06em] uppercase text-[#a36404]">
                WaitFeed Documentation
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-decima text-[10px] uppercase tracking-wider text-[#191918]/60">
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                Free & Open Source
              </span>
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                No API Keys Needed
              </span>
              <span className="px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs">
                2-Min Setup
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, ease: RELACE_EASE, delay: 0.04 }}
              className="flex flex-col gap-3 max-w-2xl"
            >
              <h1 className="text-4xl sm:text-5xl font-parabole font-normal leading-tight tracking-tight text-[#191918]">
                Learn{" "}
                <strong className="font-display font-normal text-black">
                  WaitFeed
                </strong>{" "}
                in minutes
              </h1>
              <p className="text-base sm:text-[17px] font-parabole leading-relaxed text-[#191918]/65">
                Everything you need to install WaitFeed, browse stories inside your AI
                coding agent, customize your feeds, and stay focused.
              </p>
            </motion.div>

            {/* Quick Install + Instant Search */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, ease: RELACE_EASE, delay: 0.08 }}
              className="w-full lg:w-80 shrink-0 flex flex-col gap-2.5"
            >
              <CopyCommandButton command="npx waitfeed init" />
              <div className="relative flex items-center">
                <label htmlFor="docs-search" className="sr-only">
                  Search documentation
                </label>
                <input
                  id="docs-search"
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search docs (rss, claude, hide...)"
                  className="w-full bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs px-3.5 py-2 pr-14 text-sm font-parabole text-[#191918] outline-none transition-colors docs-search-input"
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
                    ? "No topics matched — try `rss`, `claude`, or `hide`"
                    : `${matchingIds.size} matching ${matchingIds.size === 1 ? "topic" : "topics"}`}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Two-Column Editorial Docs Layout — exact max-w-266 alignment */}
      <div className="max-w-266 mx-auto px-5 sm:px-10 pt-8 sm:pt-12 flex flex-col lg:flex-row items-start gap-10 lg:gap-12">
        {/* Mobile Section Picker */}
        <div className="w-full lg:hidden sticky top-2 z-30 bg-[#fffef2]/95 backdrop-blur-xs border border-[#e3e2d8] rounded-xs p-2.5">
          <label
            htmlFor="mobile-docs-picker"
            className="block font-decima text-[10px] uppercase tracking-widest text-[#191918]/50 mb-1 px-1"
          >
            Jump to Topic
          </label>
          <select
            id="mobile-docs-picker"
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

        {/* Left Sidebar Navigation */}
        <aside className="hidden lg:flex w-56 shrink-0 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 flex-col gap-6">
          <nav aria-label="Documentation sections" className="flex flex-col gap-6">
            {DOCS_NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-1.5">
                <span className="font-decima text-[10px] uppercase tracking-[0.08em] text-[#191918]/45 px-2.5 pb-1">
                  {group.title}
                </span>
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  const isDimmed = matchingIds !== null && !matchingIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpTo(item.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-xs transition-all cursor-pointer flex items-center gap-2 border-l-2",
                        isActive
                          ? "border-l-[#fcaa2d] bg-[#f3f2e7] text-[#191918] font-medium"
                          : "border-l-transparent hover:bg-[#f3f2e7]/60 text-[#191918]/70 hover:text-[#191918]",
                        isDimmed && "opacity-35"
                      )}
                    >
                      <span className="text-[13.5px] font-parabole leading-snug">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-3.5 flex flex-col gap-2">
            <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
              Quick Resources
            </span>
            <a
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-parabole text-[#191918]/75 hover:text-[#191918] transition-colors"
            >
              Source on GitHub ↗
            </a>
            <a
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-parabole text-[#191918]/75 hover:text-[#191918] transition-colors"
            >
              npm Package ↗
            </a>
            <a
              href="https://github.com/faizjamadar18/waitfeed/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-parabole text-[#191918]/75 hover:text-[#191918] transition-colors"
            >
              Report an Issue ↗
            </a>
          </div>
        </aside>

        {/* Main Reading Column */}
        <main className="flex-1 min-w-0 flex flex-col gap-16">
          {/* 1. INTRODUCTION */}
          <section id="introduction" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="introduction"
              step="Start Here"
              title="What is WaitFeed?"
              subtitle="A calm, distraction-free developer news ticker that lives in your terminal — visible only while your coding agent works."
            />

            <p className="text-[15.5px] font-parabole leading-relaxed text-[#191918]/80 m-0">
              Whenever you ask an AI coding agent to run tests, fix bugs, or build a
              project, you usually sit there staring at a spinner—or open a social feed
              and lose 20 minutes of flow. WaitFeed keeps you in your terminal by showing
              one useful tech story while the agent works, then disappearing the second
              your agent finishes or waits on you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-1.5">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  01 · Zero Cost
                </span>
                <h3 className="text-[15.5px] font-parabole font-medium text-[#191918] m-0">
                  No API keys or tokens
                </h3>
                <p className="text-[13.5px] font-parabole text-[#191918]/70 leading-relaxed m-0">
                  Renders the fetched headline, summary, and link — no LLM, no API
                  keys, no account.
                </p>
              </div>

              <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-1.5">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  02 · Zero Clutter
                </span>
                <h3 className="text-[15.5px] font-parabole font-medium text-[#191918] m-0">
                  Quiet when you type
                </h3>
                <p className="text-[13.5px] font-parabole text-[#191918]/70 leading-relaxed m-0">
                  Only appears while your agent is busy. The moment it finishes or asks
                  you a question, it clears.
                </p>
              </div>

              <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-1.5">
                <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                  03 · One Setup
                </span>
                <h3 className="text-[15.5px] font-parabole font-medium text-[#191918] m-0">
                  Works across editors
                </h3>
                <p className="text-[13.5px] font-parabole text-[#191918]/70 leading-relaxed m-0">
                  Supports OpenCode, Claude Code, and Google Antigravity (AGY) with one
                  shared read history.
                </p>
              </div>
            </div>
          </section>

          {/* 2. QUICKSTART */}
          <section id="quickstart" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="quickstart"
              step="Step-by-Step"
              title="Quickstart"
              subtitle="Install WaitFeed in under a minute. You only need Node.js 20 or newer installed on your computer."
            />

            <StepList
              steps={[
                {
                  title: "Run the setup command in any terminal",
                  description: (
                    <>
                      Paste this command into your terminal. It opens an interactive wizard
                      that automatically detects which AI coding tools are on your machine.
                    </>
                  ),
                  content: (
                    <TerminalCommand
                      tabs={[
                        {
                          label: "npx (Recommended)",
                          command: "npx waitfeed init",
                          hint: "# Always runs the latest version without cluttering global packages",
                        },
                        {
                          label: "npm global",
                          command: "npm install -g waitfeed && waitfeed init",
                          hint: "# Optional if you prefer running `waitfeed` directly anywhere",
                        },
                      ]}
                    />
                  ),
                },
                {
                  title: "Complete the setup wizard",
                  description: (
                    <>
                      As soon as the command starts, you will see the{" "}
                      <strong className="font-medium text-[#191918]">WAITFEED</strong>{" "}
                      ASCII banner below. Use <InlineCode>↑</InlineCode> /{" "}
                      <InlineCode>↓</InlineCode> to move, <InlineCode>Space</InlineCode>{" "}
                      to check or uncheck editors and feeds, and{" "}
                      <InlineCode>Enter</InlineCode> to confirm. Click the tabs inside the
                      terminal footer to preview each wizard screen:
                    </>
                  ),
                  content: <SetupBannerPreview />,
                },
                {
                  title: "Start coding normally",
                  description: (
                    <>
                      Open OpenCode, Claude Code, or Antigravity and ask your agent to do
                      any task. WaitFeed wakes up quietly while the agent works and steps
                      back when it is your turn.
                    </>
                  ),
                  content: (
                    <DocsCallout title="Good to know" tone="amber">
                      Running <InlineCode>npx waitfeed init</InlineCode> a second time is
                      completely safe. You can re-run it anytime after installing a new
                      AI tool or if you want to change your default channels.
                    </DocsCallout>
                  ),
                },
              ]}
            />
          </section>

          {/* 3. YOUR AI EDITORS */}
          <section id="editors" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="editors"
              step="Using WaitFeed"
              title="Your AI Editors"
              subtitle="Pick your editor below to see where news shows up, how to browse all headlines, and how to pause it anytime."
            />

            <EditorGuideTabs />
          </section>

          {/* 4. CUSTOMIZING FEEDS */}
          <section id="feeds" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="feeds"
              step="Personalize"
              title="News Channels & Custom RSS"
              subtitle="Keep only the sources you enjoy reading. Disabled channels are never fetched at all."
            />

            <DocsTable
              headers={["Badge", "Source", "What it brings"]}
              rows={BUILTIN_CHANNELS.map((ch) => [
                <span
                  key={ch.badge}
                  className="inline-block font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs text-white"
                  style={{ backgroundColor: ch.color }}
                >
                  {ch.badge}
                </span>,
                <strong key={ch.name} className="font-medium text-[#191918]">
                  {ch.name}
                </strong>,
                <span key={ch.whatYouGet}>{ch.whatYouGet}</span>,
              ])}
            />

            <div className="flex flex-col gap-3">
              <h3 className="text-[17px] font-parabole font-medium text-[#191918] m-0">
                Adding your favorite blogs or changing rotation speed
              </h3>
              <p className="text-[14.5px] font-parabole leading-relaxed text-[#191918]/75 m-0">
                All three editors read the same settings file at{" "}
                <InlineCode>~/.config/waitfeed/config.json</InlineCode>. You can turn
                channels on or off (<InlineCode>true</InlineCode> /{" "}
                <InlineCode>false</InlineCode>), add up to 10 personal RSS/Atom links,
                or adjust <InlineCode>dwellSeconds</InlineCode> (from{" "}
                <InlineCode>5</InlineCode> to <InlineCode>120</InlineCode> seconds per
                story):
              </p>

              <TerminalWindow
                title="~/.config/waitfeed/config.json"
                badge="Example Config"
                copyText={CONFIG_EXAMPLE}
              >
                <pre className="font-mono text-[12.5px] leading-relaxed text-[#EDEDF0] m-0">
                  <code>{CONFIG_EXAMPLE}</code>
                </pre>
              </TerminalWindow>
            </div>
          </section>

          {/* 5. CLI COMMANDS */}
          <section id="commands" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="commands"
              step="Cheat Sheet"
              title="CLI Commands"
              subtitle="Control WaitFeed globally or one editor at a time from any terminal window."
            />

            <TerminalCommand
              tabs={[
                {
                  label: "Hide everywhere",
                  command: "npx waitfeed hide",
                  hint: "# Mutes cards across OpenCode, Claude Code, and Antigravity",
                },
                {
                  label: "Show again",
                  command: "npx waitfeed show",
                  hint: "# Turns automatic work-time cards back on",
                },
                {
                  label: "Hide one editor",
                  command: "npx waitfeed hide claude",
                  hint: "# Only hides Claude Code — swap `claude` for `opencode` or `agy`",
                },
                {
                  label: "Uninstall cleanly",
                  command: "npx waitfeed remove",
                  hint: "# Removes all WaitFeed hooks, configs, and local cache",
                },
              ]}
            />

            <DocsTable
              headers={["Command", "When to use it", "What happens"]}
              rows={SIMPLE_CLI_COMMANDS.map((row) => [
                <InlineCode key={row.command}>{row.command}</InlineCode>,
                <span key={row.whenToUse}>{row.whenToUse}</span>,
                <span key={row.whatItDoes}>{row.whatItDoes}</span>,
              ])}
            />
          </section>

          {/* 6. SMART VISIBILITY */}
          <section id="visibility" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="visibility"
              step="Interactive Demo"
              title="Smart Visibility"
              subtitle="WaitFeed follows one golden rule: it only draws while the agent is busy and never blocks your typing."
            />

            <SmartVisibilityDemo />
          </section>

          {/* 7. PRIVACY & LOCAL FILES */}
          <section id="privacy" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="privacy"
              step="Trust & Safety"
              title="Privacy & Local Storage"
              subtitle="Everything runs locally on your computer. No accounts, no tracking pixels, and no cloud backend."
            />

            <DocsCallout title="Strict Privacy Promise" tone="green">
              WaitFeed only downloads public news headlines and short page summaries. It{" "}
              <strong className="font-medium text-[#191918]">never</strong> reads your
              prompts, your code, your Git history, or your environment secrets, and it
              never phones home with analytics.
            </DocsCallout>

            <p className="text-[14.5px] font-parabole leading-relaxed text-[#191918]/75 m-0">
              Stories are saved locally once every 30 minutes so your terminal stays fast
              and works seamlessly even if you switch between OpenCode, Claude Code, and
              Antigravity. Here are the only three files WaitFeed manages for you:
            </p>

            <DocsTable
              headers={["File Path", "Purpose", "What is inside"]}
              rows={LOCAL_FILES_EXPLAINED.map((f) => [
                <InlineCode key={f.path}>{f.path}</InlineCode>,
                <strong key={f.role} className="font-medium text-[#191918]">
                  {f.role}
                </strong>,
                <span key={f.plainDesc}>{f.plainDesc}</span>,
              ])}
            />
          </section>

          {/* 8. TROUBLESHOOTING & FAQ */}
          <section id="faq" className="scroll-mt-10 flex flex-col gap-6">
            <DocsSectionHeader
              id="faq"
              step="Help"
              title="Troubleshooting & FAQ"
              subtitle="Quick answers if something feels unexpected."
            />

            <div className="flex flex-col gap-3">
              {BEGINNER_FAQS.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/55 p-4 flex flex-col gap-1.5"
                >
                  <h3 className="text-[15.5px] font-parabole font-medium text-[#191918] m-0">
                    {item.q}
                  </h3>
                  <p className="text-[14px] font-parabole leading-relaxed text-[#191918]/75 m-0">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

            {/* Clean Finish Banner */}
            <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <span className="font-decima text-[10px] uppercase tracking-widest text-[#a36404]">
                  Ready to try it?
                </span>
                <p className="text-lg font-parabole font-medium text-[#191918] m-0">
                  Run <InlineCode>npx waitfeed init</InlineCode> and put wait time to work.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <CtaButton href="/">Back to Home</CtaButton>
                <a
                  href="https://github.com/faizjamadar18/waitfeed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-decima text-xs uppercase tracking-wider px-4 py-3 rounded-xs border border-[#e3e2d8] bg-[#fffef2] hover:border-[#fcaa2d] text-[#191918] transition-colors"
                >
                  GitHub Repo ↗
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
