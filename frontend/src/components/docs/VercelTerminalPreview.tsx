"use client";

import { useState } from "react";
import { ASCII_BANNER_ROWS, EDITOR_GUIDES, type EditorKey } from "@/data/docsData";

export function AsciiWaitFeedBanner() {
  return (
    <div
      aria-label="WaitFeed 3D ASCII logo"
      className="w-full overflow-x-auto py-2 select-none"
    >
      <pre className="font-mono text-[9px] sm:text-[11px] md:text-[12px] leading-[1.12] tracking-tighter inline-block text-left">
        {ASCII_BANNER_ROWS.map((row, idx) => (
          <div key={idx} className="whitespace-pre">
            <span style={{ color: row.frontHex }}>{row.text}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function HostAdapterInteractive() {
  const [activeEditor, setActiveEditor] = useState<EditorKey>("opencode");
  const currentGuide = EDITOR_GUIDES.find((g) => g.key === activeEditor) ?? EDITOR_GUIDES[0];

  return (
    <div className="my-6 rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden">
      {/* Editor selector tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/40 px-4 py-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {EDITOR_GUIDES.map((guide) => (
            <button
              key={guide.key}
              type="button"
              onClick={() => setActiveEditor(guide.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeEditor === guide.key
                  ? "bg-neutral-800 text-white border border-neutral-700 shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>{guide.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs border border-neutral-700 bg-neutral-900 text-neutral-400">
                {guide.badge.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-neutral-400">
          {currentGuide.terminalTitle}
        </div>
      </div>

      {/* Adapter Info & Mock Terminal */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Key details & shortcuts */}
        <div className="lg:col-span-5 space-y-4 text-xs sm:text-sm">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-1">
              Where It Shows
            </div>
            <p className="text-neutral-200 leading-relaxed">
              {currentGuide.whereItShows}
            </p>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-1">
              How to Read More
            </div>
            <p className="text-neutral-200 leading-relaxed font-mono text-xs">
              {currentGuide.howToReadMore}
            </p>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-1">
              How to Hide / Mute
            </div>
            <p className="text-neutral-200 leading-relaxed font-mono text-xs">
              {currentGuide.howToHide}
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-2">
              Key Highlights
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {currentGuide.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 select-none">›</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Live Terminal Window */}
        <div className="lg:col-span-7">
          <div className="rounded-lg border border-neutral-800 bg-[#0d0d10] p-4 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800 text-neutral-400 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="ml-2 text-neutral-300">{currentGuide.terminalTitle}</span>
              </div>
              <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                ● Live State
              </span>
            </div>

            <div className="space-y-2 leading-relaxed">
              {currentGuide.sampleLines.map((line, idx) => {
                if (line.kind === "muted") {
                  return (
                    <div key={idx} className="text-neutral-400">
                      {line.text}
                    </div>
                  );
                }
                if (line.kind === "badge") {
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-sm bg-neutral-900 border border-neutral-800 flex flex-col gap-1 text-white"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-100">
                          {line.text}
                        </span>
                        {line.extra && (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-xs border border-amber-400/30">
                            {line.extra}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                if (line.kind === "body") {
                  return (
                    <div key={idx} className="text-neutral-300 pl-3">
                      {line.text}
                    </div>
                  );
                }
                if (line.kind === "link") {
                  return (
                    <div key={idx} className="text-blue-400 pl-3 underline">
                      {line.text}
                    </div>
                  );
                }
                if (line.kind === "status") {
                  return (
                    <div
                      key={idx}
                      className="pt-2 text-[11px] text-neutral-400 border-t border-neutral-800/80 flex items-center justify-between"
                    >
                      <span>{line.text}</span>
                      <span className="text-[10px] text-neutral-300 font-mono">
                        0 tokens
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
