"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EDITOR_GUIDES, type EditorKey } from "@/data/docsData";
import { RELACE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  AsciiWaitFeedBanner,
  TerminalCommand,
  TerminalWindow,
} from "./DocsPrimitives";

type SetupStepKey = "detect" | "choose" | "preview";

const SETUP_TABS: Array<{ key: SetupStepKey; label: string }> = [
  { key: "detect", label: "1. Banner & Scan" },
  { key: "choose", label: "2. Pick Tools & Feeds" },
  { key: "preview", label: "3. Live Card Preview" },
];

export function SetupBannerPreview() {
  const [step, setStep] = useState<SetupStepKey>("detect");

  return (
    <TerminalWindow
      title="zsh — npx waitfeed init"
      badge="Interactive Setup"
      copyText="npx waitfeed init"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {SETUP_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStep(tab.key)}
                className={cn(
                  "px-2.5 py-1 rounded-xs font-decima text-[10px] uppercase tracking-wider border transition-colors cursor-pointer",
                  step === tab.key
                    ? "bg-[#fcaa2d] border-[#fcaa2d] text-[#191918] font-bold"
                    : "bg-[#16161B] border-[#24242C] text-[#8A8A94] hover:text-[#EDEDF0]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="font-mono text-[11px] text-[#7D8590]">
            ↑/↓ move · Space select · Enter confirm
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Command Prompt Line */}
        <div className="font-mono text-[13px] flex items-center gap-2">
          <span className="text-[#fcaa2d] font-bold select-none">$</span>
          <span className="text-[#EDEDF0]">npx waitfeed init</span>
        </div>

        {/* Authentic 3D ASCII Startup Banner from packages/waitfeed/bin.mjs */}
        <AsciiWaitFeedBanner />

        {/* Wizard Step Output */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18, ease: RELACE_EASE }}
            className="font-mono text-[12px] leading-relaxed flex flex-col gap-1 border-t border-[#1E1E22] pt-3.5"
          >
            {step === "detect" && (
              <>
                <div className="text-[#7D8590]">
                  {"  Scanning system for AI coding agent environments..."}
                </div>
                <div>
                  <span className="text-[#27AD75]">{"  ◆ "}</span>
                  <span className="text-[#EDEDF0]">OpenCode: detected</span>
                </div>
                <div>
                  <span className="text-[#27AD75]">{"  ◆ "}</span>
                  <span className="text-[#EDEDF0]">Google Antigravity (AGY): detected</span>
                </div>
                <div>
                  <span className="text-[#27AD75]">{"  ◆ "}</span>
                  <span className="text-[#EDEDF0]">Claude Code: detected</span>
                </div>
                <div className="text-[#7D8590] pt-1">
                  {"  │ Next: choose which tools and news channels to enable"}
                </div>
              </>
            )}

            {step === "choose" && (
              <>
                <div className="text-[#EDEDF0] font-semibold">
                  <span className="text-[#39BAE6]">{"  ◇ "}</span>
                  Which news channels would you like in your rotation?
                </div>
                <div className="text-[#7D8590]">
                  {"  │ "}
                </div>
                <div>
                  <span className="text-[#fcaa2d]">{"  ▸ "}</span>
                  <span className="text-[#27AD75]">[●] </span>
                  <span className="text-[#EDEDF0] font-bold">Hacker News</span>
                  <span className="text-[#7D8590]">{"         (Tech & startups)"}</span>
                </div>
                <div>
                  <span className="text-[#27AD75]">{"    [●] "}</span>
                  <span className="text-[#EDEDF0]">Dev.to</span>
                  <span className="text-[#7D8590]">{"              (Articles & tutorials)"}</span>
                </div>
                <div>
                  <span className="text-[#27AD75]">{"    [●] "}</span>
                  <span className="text-[#EDEDF0]">GitHub Trending</span>
                  <span className="text-[#7D8590]">{"     (Open source projects)"}</span>
                </div>
                <div>
                  <span className="text-[#27AD75]">{"    [●] "}</span>
                  <span className="text-[#EDEDF0]">Reddit</span>
                  <span className="text-[#7D8590]">{"              (r/programming discussions)"}</span>
                </div>
              </>
            )}

            {step === "preview" && (
              <>
                <div className="text-[#EDEDF0] font-semibold">
                  <span className="text-[#39BAE6]">{"  ◇ "}</span>
                  Live Ticker Preview (what you will see while your agent works):
                </div>
                <div className="my-1.5 rounded-xs border border-[#2D2D35] bg-[#111114] p-3 flex flex-col gap-1 max-w-xl">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">
                      <span className="text-[#ff6600]">▍ [HN]</span>{" "}
                      <span className="text-[#EDEDF0]">
                        SWE-bench: Evaluating AI coding agents
                      </span>
                    </span>
                    <span className="text-[11px] shrink-0">
                      <span className="text-[#fcaa2d]">▲ 1.2k</span>
                      <span className="text-[#7D8590]"> · 2h</span>
                    </span>
                  </div>
                  <div className="text-[#8A8A94] pl-3">
                    Autonomous agents resolve real GitHub bugs and pass full test
                    suites without human intervention.
                  </div>
                  <div className="pl-3 text-[#39BAE6]">
                    <span className="text-[#7D8590]">&gt; </span>
                    swebench.com
                  </div>
                </div>
                <div className="text-[#27AD75]">
                  {"  ✓ WaitFeed setup complete! Happy coding."}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </TerminalWindow>
  );
}

export function EditorGuideTabs() {
  const [selected, setSelected] = useState<EditorKey>("opencode");
  const guide =
    EDITOR_GUIDES.find((item) => item.key === selected) ?? EDITOR_GUIDES[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Vercel-style Segmented Editor Tabs */}
      <div className="inline-flex flex-wrap gap-1.5 p-1 rounded-xs bg-[#f3f2e7] border border-[#e3e2d8] self-start">
        {EDITOR_GUIDES.map((item) => {
          const isActive = item.key === guide.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelected(item.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-xs text-[13px] font-parabole transition-all cursor-pointer",
                isActive
                  ? "bg-[#191918] text-[#fffef2] font-medium shadow-xs"
                  : "text-[#191918]/65 hover:text-[#191918]"
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Active Editor Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={guide.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: RELACE_EASE }}
          className="flex flex-col gap-5"
        >
          {/* Three At-a-Glance Facts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/60 p-3.5 flex flex-col gap-1">
              <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                Where it appears
              </span>
              <p className="text-[13.5px] font-parabole text-[#191918]/80 leading-relaxed m-0">
                {guide.whereItShows}
              </p>
            </div>
            <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/60 p-3.5 flex flex-col gap-1">
              <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                Read more stories
              </span>
              <p className="text-[13.5px] font-parabole text-[#191918]/80 leading-relaxed m-0">
                {guide.howToReadMore}
              </p>
            </div>
            <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/60 p-3.5 flex flex-col gap-1">
              <span className="font-decima text-[10px] uppercase tracking-wider text-[#a36404]">
                Pause or hide
              </span>
              <p className="text-[13.5px] font-parabole text-[#191918]/80 leading-relaxed m-0">
                {guide.howToHide}
              </p>
            </div>
          </div>

          {/* Live Terminal Simulation for Selected Editor */}
          <TerminalWindow title={guide.terminalTitle} badge={guide.badge}>
            <div className="flex flex-col gap-2 font-mono text-[12px] leading-relaxed">
              {guide.sampleLines.map((line, i) => {
                if (line.kind === "muted") {
                  return (
                    <div key={i} className="text-[#7D8590] pb-1">
                      {line.text}
                    </div>
                  );
                }
                if (line.kind === "badge") {
                  return (
                    <div
                      key={i}
                      className="flex flex-wrap items-baseline justify-between gap-2 pt-1 border-t border-[#1E1E22]"
                    >
                      <span className="font-semibold text-[#EDEDF0]">
                        <span style={{ color: line.badgeColor ?? "#fcaa2d" }}>
                          {line.text.slice(0, 7)}
                        </span>
                        {line.text.slice(7)}
                      </span>
                      {line.extra && (
                        <span className="text-[#fcaa2d] text-[11px] shrink-0">
                          {line.extra}
                        </span>
                      )}
                    </div>
                  );
                }
                if (line.kind === "body") {
                  return (
                    <div key={i} className="text-[#A1A1AA]">
                      {line.text}
                    </div>
                  );
                }
                if (line.kind === "link") {
                  return (
                    <div key={i} className="text-[#818CF8]">
                      {line.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className="mt-1 pt-2 border-t border-[#1E1E22] text-[11px] text-[#7D8590]"
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </TerminalWindow>

          {/* Key Highlights + Toggle Command */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <ul className="space-y-2 text-[14px] font-parabole text-[#191918]/80 list-none p-0 m-0">
              {guide.highlights.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5">
                  <span className="text-[#fcaa2d] font-bold mt-0.5 shrink-0">✓</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <TerminalCommand
              title={`${guide.name} quick switch`}
              command={guide.commandSnippet}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type AgentState = "working" | "idle" | "question";
type UserMode = "auto" | "hidden";

export function SmartVisibilityDemo() {
  const [agentState, setAgentState] = useState<AgentState>("working");
  const [userMode, setUserMode] = useState<UserMode>("auto");

  const cardShown = agentState === "working" && userMode === "auto";

  const explanation =
    userMode === "hidden"
      ? "You hid WaitFeed, so your terminal stays clean even while the agent is busy."
      : agentState === "working"
        ? "Your AI agent is busy working and doesn't need you right now — WaitFeed rotates fresh tech news."
        : agentState === "question"
          ? "Your AI paused to ask for permission or input — WaitFeed gets out of your way immediately."
          : "The task finished and it's your turn to type — WaitFeed disappears completely.";

  return (
    <div className="rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/65 p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-decima text-[10px] uppercase tracking-widest text-[#191918]/65">
          Try It Yourself · When Does WaitFeed Appear?
        </span>
        <span
          className={cn(
            "font-decima text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-xs border",
            cardShown
              ? "bg-[#27AD75]/15 border-[#27AD75]/40 text-[#166e49]"
              : "bg-[#fffef2] border-[#e3e2d8] text-[#191918]/70"
          )}
        >
          {cardShown ? "Showing Story Card" : "Terminal Clean"}
        </span>
      </div>

      {/* Simple Human-Friendly Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-3 flex flex-col gap-2">
          <span className="text-[12.5px] font-parabole font-medium text-[#191918]">
            1. What is your AI doing?
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "working", label: "Working" },
                { id: "idle", label: "Your turn / Idle" },
                { id: "question", label: "Asking permission" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAgentState(opt.id)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xs text-[12px] font-parabole border transition-colors cursor-pointer",
                  agentState === opt.id
                    ? "bg-[#191918] border-[#191918] text-[#fffef2]"
                    : "bg-[#f3f2e7] border-[#e3e2d8] text-[#191918]/75 hover:text-[#191918]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xs border border-[#e3e2d8] bg-[#fffef2] p-3 flex flex-col gap-2">
          <span className="text-[12.5px] font-parabole font-medium text-[#191918]">
            2. Did you hide WaitFeed?
          </span>
          <div className="flex gap-1.5">
            {(
              [
                { id: "auto", label: "Auto (Show when busy)" },
                { id: "hidden", label: "Hidden by you" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setUserMode(opt.id)}
                className={cn(
                  "flex-1 px-2.5 py-1.5 rounded-xs text-[12px] font-parabole border transition-colors cursor-pointer",
                  userMode === opt.id
                    ? "bg-[#fcaa2d] border-[#fcaa2d] text-[#191918] font-medium"
                    : "bg-[#f3f2e7] border-[#e3e2d8] text-[#191918]/75 hover:text-[#191918]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulated Terminal State */}
      <TerminalWindow
        title={
          agentState === "working"
            ? "agent running tests..."
            : agentState === "question"
              ? "waiting for your approval..."
              : "ready for your next prompt"
        }
      >
        <div className="flex flex-col gap-2 font-mono text-[12px]">
          {cardShown ? (
            <div className="flex flex-col gap-1 border-l-2 border-[#ff6600] pl-3 py-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[#EDEDF0] font-semibold">
                  <span className="text-[#ff6600]">[HN]</span> PostgreSQL 18 cuts
                  complex query latency with async I/O
                </span>
                <span className="text-[#fcaa2d] text-[11px] shrink-0">▲ 940 · 3h</span>
              </div>
              <span className="text-[#8A8A94]">
                Direct asynchronous disk reads reduce cold-cache wait times on large analytics tables.
              </span>
              <span className="text-[#818CF8]">&gt; postgresql.org/about/news</span>
            </div>
          ) : (
            <div className="text-[#7D8590] flex items-center gap-2 py-1">
              <span className="text-[#27AD75]">›</span>
              <span>
                {agentState === "question"
                  ? "Allow Bash command `npm test`? [Y/n]"
                  : "Type your next prompt... (WaitFeed stays out of the way)"}
              </span>
            </div>
          )}
          <div className="border-t border-[#1E1E22] pt-2 text-[11.5px] font-parabole text-[#A1A1AA]">
            {explanation}
          </div>
        </div>
      </TerminalWindow>
    </div>
  );
}
