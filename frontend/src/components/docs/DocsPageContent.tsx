"use client";

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { motion, MotionConfig } from "motion/react";
import {
  BEGINNER_FAQS,
  BUILTIN_CHANNELS,
  DOCS_NAV_GROUPS,
  EDITOR_GUIDES,
  LOCAL_FILES_EXPLAINED,
  SIMPLE_CLI_COMMANDS,
  type EditorKey,
} from "@/data/docsData";
import { CopyCommandButton } from "@/components/CopyCommandButton";
import { CtaButton } from "@/components/CtaButton";
import { GitHubIcon, NpmIcon } from "@/components/Icons";
import {
  RELACE_EASE,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  CopyableCommandChip,
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

interface DocsSearchItem {
  id: string;
  sectionId: string;
  category: string;
  title: string;
  description: string;
  keywords: string;
  editorKey?: EditorKey;
}

const SECTION_KEYWORDS: Record<string, string> = {
  introduction: "overview what is waitfeed opencode claude antigravity tech news zero tokens",
  quickstart: "install setup npx waitfeed init banner wizard ascii node 20",
  editors: "opencode claude code antigravity agy ctrl+o ctrl+n /feed band shortcuts",
  feeds: "hacker news github dev.to reddit rss custom feeds dwellSeconds speed rotate",
  commands: "cli init hide show toggle remove uninstall --keep-data",
  visibility: "busy idle working typing permission hide auto",
  privacy: "privacy local files ~/.config/waitfeed config.json cache.json api keys",
  faq: "help troubleshooting nothing showing add blog hide one editor uninstall",
};

const DOCS_SEARCH_ITEMS: DocsSearchItem[] = [
  ...ALL_NAV_ITEMS.map((item) => ({
    id: `section-${item.id}`,
    sectionId: item.id,
    category: item.group,
    title: item.label,
    description: item.summary,
    keywords: SECTION_KEYWORDS[item.id] ?? "",
  })),
  ...EDITOR_GUIDES.map((guide) => ({
    id: `editor-${guide.key}`,
    sectionId: "editors",
    category: "AI Editor",
    title: `${guide.name} — ${guide.badge}`,
    description: guide.whereItShows,
    keywords: `${guide.name} ${guide.key} ${guide.howToReadMore} ${guide.howToHide} ${guide.commandSnippet}`,
    editorKey: guide.key,
  })),
  ...BUILTIN_CHANNELS.map((ch) => ({
    id: `channel-${ch.badge.toLowerCase()}`,
    sectionId: "feeds",
    category: "Channel",
    title: ch.name,
    description: ch.whatYouGet,
    keywords: `${ch.badge} ${ch.name} feeds sources rssUrls dwellSeconds`,
  })),
  ...SIMPLE_CLI_COMMANDS.map((cmd) => ({
    id: `cmd-${cmd.command.replace(/\s+/g, "-")}`,
    sectionId: "commands",
    category: "CLI Command",
    title: cmd.command,
    description: cmd.whatItDoes,
    keywords: `${cmd.command} ${cmd.whenToUse} cli terminal`,
  })),
  ...LOCAL_FILES_EXPLAINED.map((file) => ({
    id: `file-${file.role.toLowerCase().replace(/\s+/g, "-")}`,
    sectionId: "privacy",
    category: "Local File",
    title: `${file.path} (${file.role})`,
    description: file.plainDesc,
    keywords: `${file.path} ${file.role} privacy local storage`,
  })),
  ...BEGINNER_FAQS.map((faq, idx) => ({
    id: `faq-${idx}`,
    sectionId: "faq",
    category: "FAQ",
    title: faq.q,
    description: faq.a,
    keywords: "faq troubleshooting help question",
  })),
];

const SEARCH_SUGGESTIONS = ["rss", "claude", "hide", "privacy", "opencode"];

function searchDocsItems(rawQuery: string): DocsSearchItem[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored: Array<{ item: DocsSearchItem; score: number }> = [];
  for (const item of DOCS_SEARCH_ITEMS) {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    const fullHaystack = `${titleLower} ${item.category.toLowerCase()} ${descLower} ${item.keywords.toLowerCase()}`;

    if (!terms.every((term) => fullHaystack.includes(term))) continue;

    let score = 0;
    if (item.id.startsWith("section-")) score += 10;
    if (titleLower === q) score += 50;
    else if (titleLower.startsWith(q)) score += 30;
    else if (titleLower.includes(q)) score += 20;
    if (descLower.includes(q)) score += 8;
    for (const term of terms) {
      if (titleLower.includes(term)) score += 5;
    }

    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 7).map((entry) => entry.item);
}

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

const DOCS_VIEWPORT = { once: true, amount: "some" as const };
const DOCS_SECTION_TRANSITION = { duration: 0.5, ease: RELACE_EASE };
const INTRO_CARDS_VARIANTS = staggerContainerVariants(0.06, 0.18);
const FAQ_CARDS_VARIANTS = staggerContainerVariants(0.05, 0.05);

function DocsAnimatedSection({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={DOCS_VIEWPORT}
      transition={DOCS_SECTION_TRANSITION}
      className="scroll-mt-24 md:scroll-mt-12 flex flex-col gap-6"
    >
      {children}
    </motion.section>
  );
}

export function DocsPageContent() {
  const [activeSection, setActiveSection] = useState<string>("introduction");
  const [selectedEditor, setSelectedEditor] = useState<EditorKey>("opencode");
  const [query, setQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => searchDocsItems(query), [query]);

  const matchingIds = useMemo(() => {
    if (!normalizedQuery) return null;
    return new Set(searchResults.map((item) => item.sectionId));
  }, [normalizedQuery, searchResults]);

  const showResultsDropdown = isSearchOpen && normalizedQuery.length > 0;
  const safeHighlightedIndex =
    searchResults.length === 0
      ? -1
      : Math.min(highlightedIndex, searchResults.length - 1);

  // Press "/" to focus search bar
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
        setIsSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close search popover when clicking/tapping outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
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

  function selectSearchResult(item: DocsSearchItem) {
    if (item.editorKey) {
      setSelectedEditor(item.editorKey);
    }
    jumpTo(item.sectionId);
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
  }

  function clearSearch() {
    setQuery("");
    setHighlightedIndex(0);
    setIsSearchOpen(false);
    searchInputRef.current?.focus();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (isSearchOpen) {
        setIsSearchOpen(false);
      } else {
        setQuery("");
        setHighlightedIndex(0);
        searchInputRef.current?.blur();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsSearchOpen(true);
      if (searchResults.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % searchResults.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsSearchOpen(true);
      if (searchResults.length > 0) {
        setHighlightedIndex(
          (prev) => (prev - 1 + searchResults.length) % searchResults.length
        );
      }
      return;
    }

    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      const targetItem =
        searchResults[Math.max(0, safeHighlightedIndex)] ?? searchResults[0];
      if (targetItem) {
        selectSearchResult(targetItem);
      }
    }
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="w-full pb-24">
      {/* Clean Editorial Header — exact max-w-266 alignment with Navbar & Landing */}
      <section className="w-full pt-12 sm:pt-16 relative z-40">
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

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, ease: RELACE_EASE, delay: 0.04 }}
              className="flex flex-col gap-3 max-w-xl"
            >
              <h1 className="text-4xl sm:text-5xl font-parabole font-normal leading-tight tracking-tight text-[#191918]">
                Learn{" "}
                <strong className="font-display font-normal text-black">
                  WaitFeed
                </strong>{" "}
                in minutes
              </h1>
              <p className="text-base sm:text-[17px] font-parabole leading-relaxed text-[#191918]/65 max-w-lg">
                Everything you need to install WaitFeed, browse stories inside your AI
                coding agent, customize your feeds, and stay focused.
              </p>
            </motion.div>

            {/* Quick Install + Floating Interactive Search (zero layout shift) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, ease: RELACE_EASE, delay: 0.08 }}
              className="w-full lg:w-80 shrink-0 flex flex-col gap-3"
            >
              <CopyCommandButton command="npx waitfeed init" />

              <div ref={searchContainerRef} className="relative">
                <div className="relative flex items-center">
                  <label htmlFor="docs-search" className="sr-only">
                    Search documentation
                  </label>
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 w-3.5 h-3.5 stroke-[#191918]/45"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="7" cy="7" r="4.75" />
                    <path d="m10.5 10.5 3 3" />
                  </svg>
                  <input
                    id="docs-search"
                    ref={searchInputRef}
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showResultsDropdown}
                    aria-controls="docs-search-results"
                    aria-activedescendant={
                      showResultsDropdown && safeHighlightedIndex >= 0
                        ? `docs-search-option-${safeHighlightedIndex}`
                        : undefined
                    }
                    value={query}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setHighlightedIndex(0);
                      setIsSearchOpen(true);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search docs (rss, claude, hide...)"
                    className="w-full bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs pl-9 pr-10 py-2 text-base sm:text-sm font-parabole text-[#191918] outline-none transition-colors docs-search-input"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      title="Clear search"
                      className="absolute right-2.5 inline-flex items-center justify-center p-1 text-[#191918]/45 hover:text-[#191918] cursor-pointer transition-colors"
                    >
                      <svg
                        viewBox="0 0 14 14"
                        fill="none"
                        className="w-3.5 h-3.5 stroke-current"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      >
                        <path d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5" />
                      </svg>
                    </button>
                  ) : (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute right-3 w-3.5 h-3.5 stroke-[#191918]/45"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 3.5h11l-4.4 5.2v4.1l-2.2-1.1v-3L2.5 3.5z" />
                    </svg>
                  )}
                </div>

                {showResultsDropdown && (
                  <div
                    id="docs-search-results"
                    role="listbox"
                    aria-label="Documentation search results"
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xs border border-[#e3e2d8] bg-[#fffef2] shadow-lg overflow-hidden"
                  >
                    <div className="px-3 py-1.5 bg-[#f3f2e7] border-b border-[#e3e2d8] flex items-center justify-between gap-2">
                      <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                        {searchResults.length === 0
                          ? "No matching topics"
                          : `${searchResults.length} ${searchResults.length === 1 ? "result" : "results"}`}
                      </span>
                      <span className="font-decima text-[9.5px] uppercase tracking-wider text-[#191918]/45">
                        {searchResults.length > 0 ? "↑↓ · ↵ jump" : "esc close"}
                      </span>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#e3e2d8]/70">
                        {searchResults.map((item, idx) => {
                          const isHighlighted = idx === safeHighlightedIndex;
                          return (
                            <button
                              key={item.id}
                              id={`docs-search-option-${idx}`}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectSearchResult(item)}
                              className={cn(
                                "w-full text-left px-3 py-2.5 flex flex-col gap-0.5 cursor-pointer transition-colors",
                                isHighlighted
                                  ? "bg-[#fcaa2d]/15"
                                  : "hover:bg-[#f3f2e7]/80"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-decima text-[9.5px] uppercase tracking-wider text-[#a36404]">
                                  {item.category}
                                </span>
                                {isHighlighted && (
                                  <span className="font-decima text-[9.5px] uppercase tracking-wider text-[#191918]/50">
                                    ↵ Open
                                  </span>
                                )}
                              </div>
                              <span className="text-[13.5px] font-parabole font-medium text-[#191918] leading-snug">
                                {item.title}
                              </span>
                              <span className="text-[12px] font-parabole text-[#191918]/60 leading-snug line-clamp-1">
                                {item.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3.5 flex flex-col gap-2.5">
                        <p className="text-[12.5px] font-parabole text-[#191918]/70 leading-snug m-0">
                          Nothing matched{" "}
                          <span className="font-medium text-[#191918]">
                            &ldquo;{query.trim()}&rdquo;
                          </span>
                          . Try a popular topic:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {SEARCH_SUGGESTIONS.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setQuery(suggestion);
                                setHighlightedIndex(0);
                                setIsSearchOpen(true);
                                searchInputRef.current?.focus();
                              }}
                              className="px-2 py-0.5 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7] hover:border-[#fcaa2d] font-decima text-[10px] uppercase tracking-wider text-[#191918]/80 cursor-pointer transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Two-Column Editorial Docs Layout — exact max-w-266 alignment */}
      <div className="max-w-266 mx-auto px-5 sm:px-10 pt-8 sm:pt-12 flex flex-col md:flex-row md:items-start gap-10 md:gap-8 lg:gap-12">
        {/* Mobile Section Picker */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: RELACE_EASE, delay: 0.1 }}
          className="w-full md:hidden sticky top-2 z-30 bg-[#fffef2]/95 backdrop-blur-xs border border-[#e3e2d8] rounded-xs p-2.5"
        >
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
            className="w-full bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs px-3 py-2 text-base sm:text-sm font-parabole text-[#191918] outline-none"
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
        </motion.div>

        {/* Left Sidebar Navigation — sticky below md+ so the article scrolls independently */}
        <aside className="hidden md:flex w-56 shrink-0 self-start sticky top-8 flex-col">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: RELACE_EASE, delay: 0.12 }}
            className="max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain pr-2 flex flex-col gap-5"
          >
          <nav aria-label="Documentation sections" className="flex flex-col gap-4">
            {DOCS_NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-1">
                <span className="font-decima text-[10px] uppercase tracking-[0.08em] text-[#191918]/45 px-2.5 pb-0.5">
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
                        "w-full text-left px-2.5 py-1.5 rounded-xs transition-all cursor-pointer flex items-center gap-2 border-l-2",
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

          <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-3.5 flex flex-col gap-2.5">
            <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
              Quick Resources
            </span>
            <a
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12.5px] font-parabole text-[#191918]/75 hover:text-[#191918] transition-colors"
            >
              <GitHubIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Source on GitHub ↗</span>
            </a>
            <a
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12.5px] font-parabole text-[#191918]/75 hover:text-[#191918] transition-colors"
            >
              <NpmIcon className="w-3.5 h-3.5 shrink-0 rounded-xs" />
              <span>npm Package ↗</span>
            </a>
            <a
              href="https://github.com/faizjamadar18/waitfeed/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12.5px] font-parabole text-[#191918]/75 hover:text-[#191918] transition-colors"
            >
              <GitHubIcon className="w-3.5 h-3.5 shrink-0 opacity-65" />
              <span>Report an Issue ↗</span>
            </a>
          </div>
          </motion.div>
        </aside>

        {/* Main Reading Column */}
        <main className="flex-1 min-w-0 flex flex-col gap-12 sm:gap-16">
          {/* 1. INTRODUCTION */}
          <motion.section
            id="introduction"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease: RELACE_EASE, delay: 0.14 }}
            className="scroll-mt-24 md:scroll-mt-12 flex flex-col gap-6"
          >
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

            <motion.div
              variants={INTRO_CARDS_VARIANTS}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
            >
              <motion.div
                variants={staggerItemVariants}
                className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-1.5"
              >
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
              </motion.div>

              <motion.div
                variants={staggerItemVariants}
                className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-1.5"
              >
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
              </motion.div>

              <motion.div
                variants={staggerItemVariants}
                className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 flex flex-col gap-1.5"
              >
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
              </motion.div>
            </motion.div>
          </motion.section>

          {/* 2. QUICKSTART */}
          <DocsAnimatedSection id="quickstart">
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
          </DocsAnimatedSection>

          {/* 3. YOUR AI EDITORS */}
          <DocsAnimatedSection id="editors">
            <DocsSectionHeader
              id="editors"
              step="Using WaitFeed"
              title="Your AI Editors"
              subtitle="Pick your editor below to see where news shows up, how to browse all headlines, and how to pause it anytime."
            />

            <EditorGuideTabs
              selected={selectedEditor}
              onSelect={setSelectedEditor}
            />
          </DocsAnimatedSection>

          {/* 4. CUSTOMIZING FEEDS */}
          <DocsAnimatedSection id="feeds">
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
                copyText={CONFIG_EXAMPLE}
              >
                <pre className="font-mono text-[12.5px] leading-relaxed text-[#EDEDF0] m-0">
                  <code>{CONFIG_EXAMPLE}</code>
                </pre>
              </TerminalWindow>
            </div>
          </DocsAnimatedSection>

          {/* 5. CLI COMMANDS */}
          <DocsAnimatedSection id="commands">
            <DocsSectionHeader
              id="commands"
              step="Reference"
              title="CLI Commands"
              subtitle="Control WaitFeed globally or one editor at a time from any terminal window. Click any command below to copy."
            />

            <DocsTable
              headers={["Command", "When to use it", "What happens"]}
              rows={SIMPLE_CLI_COMMANDS.map((row) => [
                <CopyableCommandChip key={row.command} command={row.command} />,
                <span key={row.whenToUse}>{row.whenToUse}</span>,
                <span key={row.whatItDoes}>{row.whatItDoes}</span>,
              ])}
            />
          </DocsAnimatedSection>

          {/* 6. SMART VISIBILITY */}
          <DocsAnimatedSection id="visibility">
            <DocsSectionHeader
              id="visibility"
              step="Interactive Demo"
              title="Smart Visibility"
              subtitle="WaitFeed follows one golden rule: it only draws while the agent is busy and never blocks your typing."
            />

            <SmartVisibilityDemo />
          </DocsAnimatedSection>

          {/* 7. PRIVACY & LOCAL FILES */}
          <DocsAnimatedSection id="privacy">
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
          </DocsAnimatedSection>

          {/* 8. TROUBLESHOOTING & FAQ */}
          <DocsAnimatedSection id="faq">
            <DocsSectionHeader
              id="faq"
              step="Help"
              title="Troubleshooting & FAQ"
              subtitle="Quick answers if something feels unexpected."
            />

            <motion.div
              variants={FAQ_CARDS_VARIANTS}
              initial="hidden"
              whileInView="visible"
              viewport={DOCS_VIEWPORT}
              className="flex flex-col gap-3"
            >
              {BEGINNER_FAQS.map((item) => (
                <motion.div
                  key={item.q}
                  variants={staggerItemVariants}
                  className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/55 p-4 flex flex-col gap-1.5"
                >
                  <h3 className="text-[15.5px] font-parabole font-medium text-[#191918] m-0">
                    {item.q}
                  </h3>
                  <p className="text-[14px] font-parabole leading-relaxed text-[#191918]/75 m-0">
                    {item.a}
                  </p>
                </motion.div>
              ))}
            </motion.div>

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
                  className="inline-flex items-center gap-2 font-decima text-xs uppercase tracking-wider px-4 py-3 rounded-xs border border-[#e3e2d8] bg-[#fffef2] hover:border-[#fcaa2d] text-[#191918] transition-colors"
                >
                  <GitHubIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>GitHub Repo ↗</span>
                </a>
              </div>
            </div>
          </DocsAnimatedSection>
        </main>
      </div>
    </div>
    </MotionConfig>
  );
}
