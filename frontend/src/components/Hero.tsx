"use client";

import { useState } from "react";
import { TerminalDemo } from "./TerminalDemo";

export function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('{\n  "plugins": ["waitfeed"]\n}');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden">
      {/* 16px Radial Dot-Grid Matrix Texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--dot-grid-color) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          opacity: 0.65,
        }}
      />

      <div className="relative mx-auto max-w-300 px-6 py-14 md:py-24">
        <div className="grid md:grid-cols-[1.05fr_1fr] gap-8 md:gap-12 items-start">
          {/* Left Column: Editorial Positioning & Primary CTA */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#27AD75]/30 bg-[#27AD75]/10 text-(--accent-color) font-data text-[11px] mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-(--accent-color)"></span>
              <span>OPENCODE TUI PLUGIN</span>
              <span className="text-[#5C5C66]">·</span>
              <span className="text-(--ink-secondary)">ZERO BACKEND</span>
            </div>

            <h1
              className="font-display text-[34px] sm:text-[42px] md:text-[48px] leading-[1.05] tracking-tight text-(--ink-primary) mb-5 max-w-[17ch]"
              style={{ fontWeight: 400 }}
            >
              The ambient news ticker for AI agent surfaces.
            </h1>

            <p className="font-body text-[15px] sm:text-[16px] leading-[1.65] text-(--ink-secondary) mb-8 max-w-[50ch]">
              While your OpenCode agent works, a slim news ticker appears in the line above the input box.
              You start typing — it vanishes. <strong className="text-(--ink-primary)">100% local</strong>,
              no ads, no accounts, no server, no API keys.
            </p>

            <p className="font-data text-[11px] text-(--ink-secondary) mb-2">
              Add to your OpenCode configuration:
            </p>

            <div className="mb-4">
              <button
                type="button"
                onClick={handleCopy}
                className="font-data text-[13px] font-medium bg-(--accent-color) text-black px-5 py-3.5 inline-flex max-w-full items-center gap-3 hover:bg-(--accent-hover) transition-all cursor-pointer shadow-[0_0_0_4px_var(--accent-glow)] select-none"
                aria-label="copy plugin snippet"
              >
                <span className="text-black/60 font-bold">$</span>
                <span className="min-w-0 truncate font-semibold">
                  {copied ? "Copied snippet to clipboard!" : 'plugins: ["waitfeed"]'}
                </span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="9" y="9" width="13" height="13" rx="0"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 text-[12px] font-data">
              <a
                className="text-(--ink-primary) no-underline border-b border-(--rule-strong) pb-0.5 transition-colors hover:border-(--ink-primary)"
                href="#install"
              >
                Explore the setup ↓
              </a>
              <span className="text-(--ink-tertiary)">·</span>
              <a
                className="text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                href="#why"
              >
                Read the lineage
              </a>
            </div>
          </div>

          {/* Right Column: Live Interactive Terminal Simulator */}
          <div className="min-w-0">
            <TerminalDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
