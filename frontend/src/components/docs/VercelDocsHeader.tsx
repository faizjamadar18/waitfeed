"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WaitFeedMarkInverted, GitHubIcon, NpmIcon } from "@/components/Icons";

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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full h-16 bg-black/85 backdrop-blur-md transition-[border-color,background-color] duration-200 border-b ${
        isScrolled ? "border-neutral-800/80" : "border-transparent"
      }`}
    >
      <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Logo + Nav Links beside it */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            aria-label="WaitFeed home"
            className="flex items-center shrink-0 text-white hover:opacity-90 transition-opacity focus-visible:outline-hidden"
          >
            <WaitFeedMarkInverted className="w-7 h-7 shrink-0" />
          </Link>

          {/* Baseline container for wordmark + nav links: shares one continuous horizontal text line */}
          <div className="flex items-baseline gap-6 lg:gap-8">
            <Link
              href="/"
              aria-label="WaitFeed home"
              className="font-logo text-[21px] sm:text-[22px] leading-none select-none text-white hover:opacity-90 transition-opacity focus-visible:outline-hidden"
            >
              <span className="italic font-medium tracking-[-0.035em] text-[#A8A596]">
                wait
              </span>
              <span className="relative inline-block not-italic font-bold tracking-[-0.035em] text-white ml-0.5">
                feed
                <svg
                  viewBox="0 0 100 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-2px",
                    bottom: "-5px",
                    width: "calc(100% + 5px)",
                    height: "6px",
                    overflow: "visible",
                    pointerEvents: "none",
                  }}
                >
                  <path
                    d="M 1 9.5 C 25 3.5, 60 1.5, 99 4 C 65 5.5, 30 7.5, 1 9.5 Z"
                    fill="#fcaa2d"
                  />
                </svg>
              </span>
            </Link>

            {/* Nav links on the left, directly beside the wordmark on the same baseline */}
            <nav className="hidden md:flex items-baseline gap-5 lg:gap-6 text-xs sm:text-[13px] font-normal text-neutral-400">
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
          </div>
        </div>

        {/* Right: Search Bar + Social/External Icons + Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Button in right corner */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden sm:flex items-center justify-between gap-3 h-8 w-44 md:w-52 px-2.5 rounded-md bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-300 text-xs tracking-wide transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-2 truncate">
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="7" cy="7" r="5" />
                <path d="m11 11 3.5 3.5" />
              </svg>
              <span className="truncate">Search...</span>
            </span>
            <kbd className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>

          {/* Mobile Search Icon */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className="sm:hidden w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900 transition-colors"
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

          {/* External links */}
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WaitFeed on GitHub"
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            >
              <GitHubIcon className="w-4 h-4 text-neutral-300" />
            </a>
            <a
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WaitFeed on npm"
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            >
              <NpmIcon className="w-4 h-4 text-neutral-300" />
            </a>
          </div>

          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900 transition-colors"
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
