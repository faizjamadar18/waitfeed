"use client";

import { useState } from "react";
import { WF_VERSION } from "@/lib/data";

export function Navbar() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('{\n  "plugins": ["waitfeed"]\n}');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-(--rule-default) bg-(--bg-primary)/85 backdrop-blur-sm">
      <div className="mx-auto max-w-300 flex items-center justify-between px-6 py-3.5">
        <a className="no-underline flex items-center gap-2" href="#">
          <span className="font-data font-bold uppercase tracking-[0.06em] text-(--ink-primary) select-none text-[14px]">
            wait<span className="text-(--accent-color) mx-[0.15em]">·</span>feed
          </span>
          <span className="hidden sm:inline-block font-data text-[10px] text-(--ink-tertiary) uppercase tracking-wider border border-(--rule-strong) px-1.5 py-0.5 rounded-xs">
            v{WF_VERSION}
          </span>
        </a>

        <div className="hidden md:flex items-center gap-6 font-data text-[12px]">
          <a
            className="text-(--ink-secondary) hover:text-(--ink-primary) transition-colors no-underline"
            href="#why"
          >
            Why
          </a>
          <a
            className="text-(--ink-secondary) hover:text-(--ink-primary) transition-colors no-underline"
            href="#how"
          >
            How it works
          </a>
          <a
            className="text-(--ink-secondary) hover:text-(--ink-primary) transition-colors no-underline"
            href="#channels"
          >
            Channels
          </a>
          <a
            className="text-(--ink-secondary) hover:text-(--ink-primary) transition-colors no-underline"
            href="#install"
          >
            Install
          </a>
          <a
            className="text-(--ink-secondary) hover:text-(--ink-primary) transition-colors no-underline"
            href="#faq"
          >
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={handleCopy}
              className="font-data text-[11px] tracking-tight bg-(--ink-primary) text-(--bg-primary) px-3 py-1.5 inline-flex items-center gap-2 hover:bg-white transition-colors cursor-pointer select-none"
              aria-label="copy install plugin snippet"
            >
              <span className="text-(--ink-tertiary) font-bold">opencode.json</span>
              <span className="truncate max-w-37.5 text-(--bg-primary) font-semibold">
                {copied ? "✓ copied to clipboard" : 'plugins: ["waitfeed"]'}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="0"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>

          <a
            href="https://github.com/faizjamadar18/waitfeed"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className="inline-flex items-center gap-1.5 font-data text-[12px] border border-(--rule-default) bg-(--bg-surface) text-(--ink-secondary) px-3 py-1.5 hover:border-(--rule-strong) hover:text-(--ink-primary) hover:bg-(--bg-surface-hover) transition-colors no-underline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.479 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
