"use client";

import Link from "next/link";
import { WaitFeedBrand, GitHubIcon, NpmIcon } from "@/components/Icons";

interface VercelDocsHeaderProps {
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export function VercelDocsHeader({
  onOpenSearch,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: VercelDocsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-black/85 backdrop-blur-md border-b border-neutral-800/80 transition-colors">
      <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand + Breadcrumb */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            aria-label="WaitFeed home"
            className="flex items-center text-white hover:opacity-90 transition-opacity focus-visible:outline-hidden"
          >
            <WaitFeedBrand
              isDark={true}
              markClassName="w-6 h-6"
              textClassName="text-[19px]"
            />
          </Link>
          <span className="text-neutral-600 font-light select-none text-lg">/</span>
          <Link
            href="/docs"
            className="text-xs uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
          >
            Docs
          </Link>
        </div>

        {/* Center: Vercel-style Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full h-9 px-3 rounded-md bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-300 flex items-center justify-between text-xs tracking-wide transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="7" cy="7" r="5" />
                <path d="m11 11 3.5 3.5" />
              </svg>
              <span>Search documentation...</span>
            </span>
            <kbd className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-neutral-800 text-neutral-400 border border-neutral-700">
              <span className="text-[12px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Links + Icons + Mobile Toggle */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900 transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="m11 11 3.5 3.5" />
            </svg>
          </button>

          {/* Quick Nav Anchor Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 text-xs text-neutral-400 font-medium">
            <a
              href="#quickstart"
              className="hover:text-white transition-colors"
            >
              Quickstart
            </a>
            <a
              href="#agent-claude"
              className="hover:text-white transition-colors"
            >
              Agents
            </a>
            <a
              href="#architecture"
              className="hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#config-schema"
              className="hover:text-white transition-colors"
            >
              Config
            </a>
            <a
              href="#cli-init"
              className="hover:text-white transition-colors"
            >
              CLI
            </a>
          </nav>

          <div className="hidden sm:block h-4 w-px bg-neutral-800" />

          {/* External links */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WaitFeed on GitHub"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            >
              <GitHubIcon className="w-4 h-4 text-neutral-300" />
            </a>
            <a
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WaitFeed on npm"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            >
              <NpmIcon className="w-4 h-4 text-neutral-300" />
            </a>
          </div>

          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900 transition-colors"
          >
            {isMobileSidebarOpen ? (
              <svg
                viewBox="0 0 16 16"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l10 10M13 3 3 13" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 16 16"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
