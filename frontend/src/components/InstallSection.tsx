"use client";

import { useState } from "react";

export function InstallSection() {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const snippetCode = '{\n  "plugins": ["waitfeed"]\n}';
  const readerCommand = "/news";

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const copyCli = () => {
    navigator.clipboard.writeText(readerCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <section id="install" className="border-t border-(--rule-default) bg-(--bg-primary)">
      <div className="mx-auto grid max-w-300 md:grid-cols-2">
        {/* Left Column: Direct OpenCode Plugin Install */}
        <div className="min-w-0 px-6 py-14 md:py-20 md:pr-12">
          <h2
            className="font-display text-[26px] md:text-[32px] leading-[1.15] tracking-[-0.02em] text-(--ink-primary) mb-2"
            style={{ fontWeight: 400 }}
          >
            Add to OpenCode in seconds.
          </h2>
          <p className="mb-6 font-body text-[15px] leading-[1.6] text-(--ink-secondary)">
            One line in your <code className="font-data text-[13px] text-(--ink-primary)">opencode.json(c)</code>.
            Windows, macOS, and Linux supported natively.
          </p>

          <div
            role="group"
            aria-label="install snippet with copy button"
            className="relative w-full bg-(--ink-primary) text-(--bg-primary) px-6 py-5 font-data text-[13px] select-all shadow-md"
          >
            <div className="flex flex-col gap-1">
              <span className="text-(--ink-tertiary) text-[11px] font-bold uppercase tracking-wider">
                opencode.json(c)
              </span>
              <pre className="text-(--bg-primary) font-semibold leading-relaxed m-0">
                <code>{snippetCode}</code>
              </pre>
            </div>
            <button
              type="button"
              onClick={copySnippet}
              className="absolute top-4 right-4 p-2 bg-[#D4D4D8] hover:bg-white text-(--bg-primary) transition-colors cursor-pointer"
              aria-label="copy install command"
            >
              {copiedSnippet ? (
                <span className="text-[11px] font-bold">✓ Copied</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="0"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>

          <details className="mt-5 border border-(--rule-default) bg-(--bg-surface)">
            <summary className="cursor-pointer px-4 py-3 font-data text-[12px] text-(--ink-secondary) hover:text-(--ink-primary) select-none">
              What does this plugin do after install?
            </summary>
            <div className="px-4 pb-4 font-body text-[13px] leading-relaxed text-(--ink-secondary)">
              OpenCode loads the package automatically. The server side polls your enabled feeds every 30 minutes and
              writes a shared cache in{" "}
              <code className="mx-1 font-data text-[12px] text-(--ink-primary)">~/.config/waitfeed/</code>; the TUI only
              ever reads that file. Typing <code className="mx-1 font-data text-[12px] text-(--ink-primary)">/news</code>{" "}
              opens the fullscreen reader and creates your config on first open — keys 1–4 flip channels right there.
              Story digests are written on a dedicated WaitFeed session inside your own OpenCode plan. First run is
              honest: the ticker stays empty for a few seconds until the first stories land.
            </div>
          </details>
        </div>

        {/* Right Column: What happens after install & philosophy */}
        <div className="min-w-0 border-t border-(--rule-default) px-6 py-14 md:border-l md:border-t-0 md:py-20 md:pl-12">
          <h2
            className="font-display text-[26px] md:text-[32px] leading-[1.15] tracking-[-0.02em] text-(--ink-primary) mb-2"
            style={{ fontWeight: 400 }}
          >
            There is no step two.
          </h2>
          <p className="mb-6 max-w-[44ch] font-body text-[15px] leading-[1.6] text-(--ink-secondary)">
            No installer, no wizard, no standalone CLI — the reader itself is the setup. After the plugins line, restart
            OpenCode and type this in the prompt:
          </p>

          <div className="relative w-full bg-(--bg-surface) border border-(--rule-strong) text-(--ink-primary) px-5 py-4 font-data text-[13px] mb-6">
            <div className="flex items-center gap-3">
              <span className="text-(--accent-color) font-bold">&gt;</span>
              <span className="truncate">{readerCommand}</span>
            </div>
            <button
              type="button"
              onClick={copyCli}
              className="absolute top-3.5 right-3.5 p-1.5 hover:bg-(--bg-surface-hover) text-(--ink-secondary) hover:text-(--ink-primary) transition-colors cursor-pointer"
              aria-label="copy reader command"
            >
              {copiedCli ? (
                <span className="text-[11px] font-bold text-(--accent-color)">✓</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="0"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-(--ink-primary) px-4 py-2 font-body text-[13px] font-medium text-(--bg-primary) no-underline transition-colors duration-150 hover:bg-white"
            >
              Read full docs on GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              rel="noreferrer"
              className="border-b border-(--rule-strong) pb-0.5 font-body text-[13px] text-(--ink-secondary) no-underline transition-colors hover:text-(--ink-primary)"
            >
              View package on npm ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
