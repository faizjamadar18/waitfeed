"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PIPELINE_STAGES } from "@/data/docsData";
import { RELACE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { InlineCode } from "./DocsPrimitives";

export function PipelineExplorer() {
  const [activeId, setActiveId] = useState<string>(PIPELINE_STAGES[0].id);
  const current =
    PIPELINE_STAGES.find((stage) => stage.id === activeId) ?? PIPELINE_STAGES[0];

  return (
    <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-decima text-[10px] uppercase tracking-widest text-[#191918]/60">
          Interactive Pipeline Inspector · Click a stage
        </span>
        <span className="font-mono text-[11px] text-[#a36404]">
          runPipeline(deps)
        </span>
      </div>

      {/* Stage Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {PIPELINE_STAGES.map((stage) => {
          const isSelected = stage.id === current.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveId(stage.id)}
              className={cn(
                "text-left p-2.5 rounded-xs border transition-all duration-200 cursor-pointer flex flex-col gap-1",
                isSelected
                  ? "bg-[#191918] border-[#191918] text-[#fffef2] shadow-xs"
                  : "bg-[#fffef2] border-[#e3e2d8] text-[#191918] hover:border-[#fcaa2d]"
              )}
            >
              <span
                className={cn(
                  "font-decima text-[10px] uppercase tracking-wider",
                  isSelected ? "text-[#fcaa2d]" : "text-[#191918]/45"
                )}
              >
                Step {stage.step}
              </span>
              <span className="text-xs font-medium leading-snug">
                {stage.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: RELACE_EASE }}
          className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-4 sm:p-5 flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e3e2d8]">
            <div>
              <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                Stage {current.step}
              </span>
              <h3 className="text-lg font-parabole font-medium text-[#191918] tracking-tight">
                {current.name}
              </h3>
            </div>
            <InlineCode>{current.file}</InlineCode>
          </div>

          <p className="text-sm font-parabole leading-relaxed text-[#191918]/75">
            {current.summary}
          </p>

          <ul className="space-y-1.5 text-[13px] font-parabole text-[#191918]/75 list-none p-0 m-0">
            {current.details.map((detail) => (
              <li key={detail} className="flex items-start gap-2">
                <span className="text-[#fcaa2d] font-bold leading-5 shrink-0">▸</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#e3e2d8]">
            {current.constants.map((c) => (
              <div
                key={c.key}
                className="rounded-xs bg-[#f3f2e7] border border-[#e3e2d8] px-2.5 py-2 flex flex-col gap-0.5"
              >
                <span className="font-mono text-[10px] text-[#191918]/55 truncate">
                  {c.key}
                </span>
                <span className="font-decima text-xs text-[#191918] uppercase">
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type SimMode = "auto" | "hide" | "show";

export function VisibilityRulePlayground() {
  const [mode, setMode] = useState<SimMode>("auto");
  const [busy, setBusy] = useState<boolean>(true);
  const [waitingOnUser, setWaitingOnUser] = useState<boolean>(false);

  // Exact implementation of newsVisible() from packages/waitfeed/core/config.ts
  const isVisible = mode === "hide" ? false : busy && !waitingOnUser;

  const reason =
    mode === "hide"
      ? "Dismissed: newsMode === \"hide\" overrides active turns until the next turn or `show`/`toggle`."
      : !busy
        ? "Quiet at idle: busy === false. No host ever pins a card on an idle prompt (even legacy \"show\")."
        : waitingOnUser
          ? "Yielded to user: waitingOnUser === true (pending permission or AskUserQuestion form)."
          : "Visible: agent is actively executing without waiting on user input.";

  return (
    <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-decima text-[10px] uppercase tracking-widest text-[#191918]/60">
          Visibility Gate Simulator · core/config.ts
        </span>
        <span
          className={cn(
            "font-decima text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs border",
            isVisible
              ? "bg-[#27AD75]/15 border-[#27AD75]/40 text-[#166e49]"
              : "bg-[#191918]/8 border-[#191918]/15 text-[#191918]/70"
          )}
        >
          {isVisible ? "Card Rendered" : "Terminal Quiet"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* newsMode */}
        <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-3 flex flex-col gap-2">
          <span className="font-mono text-[11px] text-[#191918]/60">mode: NewsMode</span>
          <div className="flex gap-1.5">
            {(["auto", "hide", "show"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-xs font-mono text-[11px] border transition-colors cursor-pointer",
                  mode === m
                    ? "bg-[#fcaa2d] border-[#fcaa2d] text-[#191918] font-bold"
                    : "bg-[#f3f2e7] border-[#e3e2d8] text-[#191918]/70 hover:text-[#191918]"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* busy */}
        <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-3 flex flex-col gap-2">
          <span className="font-mono text-[11px] text-[#191918]/60">busy: boolean</span>
          <div className="flex gap-1.5">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setBusy(val)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-xs font-mono text-[11px] border transition-colors cursor-pointer",
                  busy === val
                    ? "bg-[#191918] border-[#191918] text-[#fffef2] font-bold"
                    : "bg-[#f3f2e7] border-[#e3e2d8] text-[#191918]/70 hover:text-[#191918]"
                )}
              >
                {String(val)}
              </button>
            ))}
          </div>
        </div>

        {/* waitingOnUser */}
        <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-3 flex flex-col gap-2">
          <span className="font-mono text-[11px] text-[#191918]/60">waitingOnUser: boolean</span>
          <div className="flex gap-1.5">
            {[false, true].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setWaitingOnUser(val)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-xs font-mono text-[11px] border transition-colors cursor-pointer",
                  waitingOnUser === val
                    ? "bg-[#191918] border-[#191918] text-[#fffef2] font-bold"
                    : "bg-[#f3f2e7] border-[#e3e2d8] text-[#191918]/70 hover:text-[#191918]"
                )}
              >
                {String(val)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Output */}
      <div className="rounded-xs border border-[#1E1E22] bg-[#0A0A0C] px-4 py-3 font-mono text-[12px] text-[#EDEDF0] flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <span className="text-[#8A8A94]">newsVisible(</span>
            <span className="text-[#fcaa2d]">&quot;{mode}&quot;</span>
            <span className="text-[#8A8A94]">, </span>
            <span className="text-[#3fb950]">{String(busy)}</span>
            <span className="text-[#8A8A94]">, </span>
            <span className="text-[#8a63f4]">{String(waitingOnUser)}</span>
            <span className="text-[#8A8A94]">) </span>
            <span className="text-[#5C5C66]">===</span>{" "}
            <span className={isVisible ? "text-[#27AD75] font-bold" : "text-[#F85149] font-bold"}>
              {String(isVisible)}
            </span>
          </span>
        </div>
        <p className="text-[11px] text-[#8A8A94] font-parabole m-0">{reason}</p>
      </div>
    </div>
  );
}

export function CardAnatomyDiagram() {
  const [selectedPart, setSelectedPart] = useState<"head" | "body" | "link">("head");

  const notes = {
    head: {
      title: "Row 1 · Badge + Wrapping Title + Right-Justified Meta",
      text: "OpenCode renders via flexGrow={1} minWidth={0} so headlines never truncate. Claude & AGY use agyHeadlineRows() to word-wrap across indented continuation lines while pinning ▲ score · age to the right margin (COLUMNS - 4 on Claude).",
    },
    body: {
      title: "Row 2..4 · Fed Description (Max 3 Rows, Never Invented)",
      text: "Uses item.context stored up to 600 chars in cache.json (or 240 chars from page meta). Wrapped via wordWrap() up to AGY_DESC_MAX_ROWS = 3 on statuslines. Items without a usable context or with headline echoes omit these rows completely.",
    },
    link: {
      title: "Bottom Row · OSC 8 Hyperlink with Outside Marker",
      text: "Shortened visually by linkLabel(url) (e.g. github.com/…/waitfeed) while the OSC 8 escape sequence wraps only the label—keeping the `   > ` marker outside the terminal hover underline.",
    },
  }[selectedPart];

  return (
    <div className="rounded-xs border border-[#1E1E22] bg-[#0A0A0C] text-[#EDEDF0] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1E1E22] bg-[#0d0d0f] text-[10px] font-decima uppercase tracking-wider text-[#8A8A94]">
        <span>Terminal Card Anatomy · Click a layer</span>
        <span className="text-[#27AD75]">Shared Layout</span>
      </div>

      <div className="p-4 flex flex-col gap-1.5 font-mono text-[12px]">
        <button
          type="button"
          onClick={() => setSelectedPart("head")}
          className={cn(
            "text-left px-2.5 py-1.5 rounded-xs border transition-colors cursor-pointer flex items-center justify-between gap-3",
            selectedPart === "head"
              ? "border-[#fcaa2d] bg-[#fcaa2d]/10"
              : "border-transparent hover:border-[#1E1E22]"
          )}
        >
          <span className="truncate">
            <span className="text-[#ff6600] font-bold">▍ [HN]</span>{" "}
            <span className="text-[#EDEDF0]">
              Show HN: Local-first developer news ticker inside agent wait states
            </span>
          </span>
          <span className="shrink-0 text-[#8A8A94]">▲ 1.4k · 2h</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPart("body")}
          className={cn(
            "text-left px-2.5 py-1.5 rounded-xs border transition-colors cursor-pointer text-[#8A8A94] leading-relaxed",
            selectedPart === "body"
              ? "border-[#fcaa2d] bg-[#fcaa2d]/10 text-[#EDEDF0]"
              : "border-transparent hover:border-[#1E1E22]"
          )}
        >
          <span>
            &nbsp;&nbsp;&nbsp;Polls Hacker News, GitHub Trending, Dev.to, Reddit, and RSS into a single local cache. Quiet at idle; clears the moment you type.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPart("link")}
          className={cn(
            "text-left px-2.5 py-1.5 rounded-xs border transition-colors cursor-pointer text-[#8A8A94]",
            selectedPart === "link"
              ? "border-[#fcaa2d] bg-[#fcaa2d]/10"
              : "border-transparent hover:border-[#1E1E22]"
          )}
        >
          <span>&nbsp;&nbsp;&nbsp;&gt; </span>
          <span className="underline decoration-[#818CF8]/60 text-[#818CF8]">
            github.com/…/waitfeed
          </span>
        </button>
      </div>

      <div className="border-t border-[#1E1E22] bg-[#0d0d0f] px-4 py-3 flex flex-col gap-1">
        <span className="font-decima text-[10px] uppercase tracking-wider text-[#fcaa2d]">
          {notes.title}
        </span>
        <p className="text-xs font-parabole text-[#8A8A94] leading-relaxed m-0">
          {notes.text}
        </p>
      </div>
    </div>
  );
}

