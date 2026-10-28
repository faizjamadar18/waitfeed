"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TechCard {
  channel: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  title: string;
  score: string;
  time: string;
  copy: string;
  url: string;
  domain: string;
}

interface ScriptScenario {
  prompt: string;
  lines: string[];
}

const TECH_CARDS: TechCard[] = [
  {
    channel: "HN",
    badgeBg: "bg-[#fcaa2d]",
    badgeText: "text-[#0A0A0C]",
    borderAccent: "border-[#fcaa2d]",
    title: "Frontier models now write 40% of code, shifting devs to architecture",
    score: "▲ 2.8k",
    time: "1h",
    copy: "How autonomous agent loops are handling daily boilerplate and test suites, turning software engineers into high-leverage system reviewers.",
    url: "https://news.ycombinator.com/item?id=39918204",
    domain: "news.ycombinator.com",
  },
  {
    channel: "GH",
    badgeBg: "bg-[#27AD75]",
    badgeText: "text-[#0A0A0C]",
    borderAccent: "border-[#27AD75]",
    title: "morluto/rea · Reverse Engineer Anything with AI agents",
    score: "▲ 84.6k",
    time: "1h",
    copy: "Autonomous binary and protocol reverse-engineering toolkit. Hooks decompilers directly to agent workflows to map complex closed software.",
    url: "https://github.com/morluto/rea",
    domain: "github.com",
  },
  {
    channel: "RED",
    badgeBg: "bg-[#FF4500]",
    badgeText: "text-white",
    borderAccent: "border-[#FF4500]",
    title: "r/technology · Open source AI is matching Big Tech giants",
    score: "▲ 3.1k",
    time: "5h",
    copy: "Community benchmarks show open-weights models now match closed corporate APIs across 85% of real-world everyday developer tasks.",
    url: "https://reddit.com/r/technology",
    domain: "reddit.com",
  },
  {
    channel: "DEV",
    badgeBg: "bg-[#8A63F4]",
    badgeText: "text-white",
    borderAccent: "border-[#8A63F4]",
    title: "Automated reasoning is finding and patching zero-day bugs in minutes",
    score: "▲ 1.1k",
    time: "3h",
    copy: "Real-time code analysis tools now detect memory vulnerabilities and supply-chain flaws, automatically writing verified regression-safe fixes.",
    url: "https://dev.to/security/automated-zero-day-patching",
    domain: "dev.to",
  },
];

const SCRIPTS: ScriptScenario[] = [
  {
    prompt: "fix race condition in token refresh",
    lines: [
      "Grep   refreshToken in src/auth (2 matches)",
      "Read   src/auth/session.ts",
      "Read   tests/auth.test.ts",
      "Edit   src/auth/session.ts  +18 −4",
      "Edit   tests/auth.test.ts   +24 −2",
      "Bash · vitest run tests/auth.test.ts",
      "  ✓ 14 tests passed · mutex verified (310 ms)",
      "Bash · npx tsc --noEmit",
    ],
  },
  {
    prompt: "now add rate limiting to /login",
    lines: [
      "Read   src/middleware/rate-limit.ts",
      "Read   src/routes/auth.ts",
      "Edit   src/routes/auth.ts  +14 −3",
      "Edit   tests/rate-limit.test.ts  +28 −0",
      "Bash · vitest run tests/rate-limit.test.ts",
      "  ✓ 9 tests passed (195 ms)",
      "  ✓ 5 req/min burst limit enforced",
      "Bash · pnpm lint",
    ],
  },
  {
    prompt: "run security audit and build",
    lines: [
      "Read   package.json",
      "Bash · pnpm audit --prod",
      "  ✓ 0 vulnerabilities found (842 pkgs)",
      "Bash · pnpm build",
      "  ✓ compiled production bundle (1.1s)",
      "Bash · npx vitest run",
      "  ✓ 48 tests passed (0 errors)",
      "Done   all security & build checks passed",
    ],
  },
];

const INITIAL_HISTORY = [
  "> git status --short",
  " M src/auth/session.ts",
  "> pnpm test:auth",
  "  ✓ 12 unit tests passed (240 ms)",
];

const LINE_INTERVALS = [400, 850, 1300, 1800, 2350, 2900, 3500, 4150];
const STEP_LABELS = ["agent working", "ticker streaming", "you're typing"];

export function HeroTerminal() {
  const [history, setHistory] = useState<string[]>(INITIAL_HISTORY);
  const [status, setStatus] = useState<"working" | "typing">("typing");
  const [prompt, setPrompt] = useState("");
  const [scriptIndex, setScriptIndex] = useState(0);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [slotVisible, setSlotVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const timeAccumRef = useRef<number>(0);
  const firedEventsRef = useRef<Set<string>>(new Set());
  const isVisibleRef = useRef<boolean>(true);
  const reducedMotionRef = useRef<boolean>(false);
  const userInteractingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scriptIndexRef = useRef<number>(0);

  const handleSubmitPrompt = useCallback((newPrompt: string) => {
    userInteractingRef.current = false;

    setPrompt(newPrompt);
    setInputValue("");
    setVisibleLineCount(0);
    setSlotVisible(true);
    setStatus("working");

    const pLen = newPrompt.length;
    const enterThreshold = 600 + 75 * pLen + 400;
    timeAccumRef.current = enterThreshold;
    firedEventsRef.current = new Set(["enter"]);
    for (let i = 0; i < pLen; i++) {
      firedEventsRef.current.add(`key${i}`);
    }
  }, []);

  const scheduleResume = useCallback(
    (typedText: string) => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        const nextPrompt =
          typedText.trim().slice(0, 64) ||
          SCRIPTS[scriptIndexRef.current].prompt;
        handleSubmitPrompt(nextPrompt);
      }, 2400);
    },
    [handleSubmitPrompt]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      userInteractingRef.current = true;
      if (slotVisible) {
        setSlotVisible(false);
      }
      setStatus("typing");
      scheduleResume(val);
    },
    [slotVisible, scheduleResume]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      const nextPrompt =
        inputValue.trim().slice(0, 64) ||
        SCRIPTS[scriptIndexRef.current].prompt;
      handleSubmitPrompt(nextPrompt);
    },
    [inputValue, handleSubmitPrompt]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotionRef.current) {
      setSlotVisible(true);
      setPrompt(SCRIPTS[0].prompt);
      setVisibleLineCount(5);
      setStatus("working");
      return;
    }

    let isIntersecting = true;
    const updateVisibility = () => {
      isVisibleRef.current = isIntersecting && document.visibilityState === "visible";
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isIntersecting = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.35 }
    );

    observer.observe(container);
    document.addEventListener("visibilitychange", updateVisibility);

    const trigger = (key: string, threshold: number, fn: () => void) => {
      if (timeAccumRef.current >= threshold && !firedEventsRef.current.has(key)) {
        firedEventsRef.current.add(key);
        fn();
      }
    };

    const interval = setInterval(() => {
      if (!isVisibleRef.current || userInteractingRef.current) return;

      timeAccumRef.current += 100;
      const currentScript = SCRIPTS[scriptIndexRef.current];
      const pLen = currentScript.prompt.length;
      const enterThreshold = 600 + 75 * pLen + 400;

      // 1. Type prompt character-by-character into the prompt input line
      for (let i = 0; i < pLen; i++) {
        trigger(`key${i}`, 600 + 75 * i, () => {
          setInputValue(currentScript.prompt.slice(0, i + 1));
        });
      }

      // 2. Press Enter: prompt moves to activity log, news panel reveals, agent begins working
      trigger("enter", enterThreshold, () => {
        setPrompt(currentScript.prompt);
        setInputValue("");
        setStatus("working");
        setSlotVisible(true);
      });

      // 3. Execution logs stream in line by line while the news ticker is active
      LINE_INTERVALS.forEach((offset, idx) => {
        trigger(`line${idx}`, enterThreshold + offset, () => {
          setVisibleLineCount(idx + 1);
        });
      });

      // 4. Cycle completed: pause to let user read, then transition to next scenario
      const cycleEnd = enterThreshold + 4150 + 2600;
      trigger("cycleEnd", cycleEnd, () => {
        setHistory((prev) => [
          ...prev.slice(-2),
          `> ${currentScript.prompt}`,
          ...currentScript.lines.slice(-2),
        ]);
        setPrompt("");
        setVisibleLineCount(0);
        setSlotVisible(false);
        setStatus("typing");
        setCardIndex((prev) => (prev + 1) % TECH_CARDS.length);

        const nextIdx = (scriptIndexRef.current + 1) % SCRIPTS.length;
        scriptIndexRef.current = nextIdx;
        setScriptIndex(nextIdx);

        timeAccumRef.current = 0;
        firedEventsRef.current = new Set();
      });
    }, 100);

    return () => {
      clearInterval(interval);
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [handleSubmitPrompt]);

  const currentScript = SCRIPTS[scriptIndex];
  const currentCard = TECH_CARDS[cardIndex];
  const visibleLines = currentScript.lines.slice(0, visibleLineCount);
  const activeStepIndices = status === "working" ? [0, 1] : [2];

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Demo: tech ticker shows while agent works and clears when you type"
      className="w-full select-none"
    >
      {/* Terminal Frame */}
      <div className="border border-[#1E1E22] bg-[#0A0A0C] font-mono text-[12px] leading-normal text-[#EDEDF0] shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center gap-1.5 border-b border-[#1E1E22] px-3 py-2 text-[10px] text-[#5C5C66]">
          <span className="h-2 w-2 rounded-full bg-[#8A9397]" />
          <span className="h-2 w-2 rounded-full bg-[#8A9397]" />
          <span className="h-2 w-2 rounded-full bg-[#8A9397]" />
          <span className="ml-2 text-[#8A8A94]">surface 01 — terminal</span>
          <span className="ml-auto flex items-center gap-1.5 text-[#8A8A94]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#27AD75]" />
            live
          </span>
        </div>

        {/* Activity Log (Continuous Terminal Flow) */}
        <div
          aria-hidden="true"
          className="flex h-36 sm:h-44 flex-col justify-end overflow-hidden px-4 pb-2 pt-3"
        >
          {history.map((line, idx) => (
            <div
              key={`hist-${idx}`}
              className={cn(
                "shrink-0 truncate",
                line.startsWith(">") ? "text-[#EDEDF0]" : line.startsWith("  ") ? "text-[#5C5C66]" : "text-[#8A8A94]"
              )}
            >
              <span className="whitespace-pre">{line}</span>
            </div>
          ))}
          {prompt ? (
            <div className="shrink-0 truncate text-[#EDEDF0]">
              <span className="mr-2 text-[#5C5C66]">&gt;</span>
              {prompt}
            </div>
          ) : null}
          {visibleLines.map((line, idx) => (
            <div
              key={`line-${idx}`}
              className={cn(
                "shrink-0 truncate",
                line.startsWith("  ") ? "text-[#5C5C66]" : "text-[#8A8A94]"
              )}
            >
              <span className="whitespace-pre">{line}</span>
            </div>
          ))}
          {status === "working" && (
            <div className="shrink-0 text-[#5C5C66]">
              <span className="mr-2 inline-block animate-spin text-[#fcaa2d]">⠋</span>
              working…
            </div>
          )}
        </div>

        {/* Ticker Slot Area (Collapsible, vanishes on type with zero empty gap) */}
        <div
          className={cn(
            "transition-all duration-300 ease-out overflow-hidden text-[11px]",
            slotVisible
              ? "max-h-28 border-t border-[#1E1E22] px-4 py-2.5 opacity-100"
              : "max-h-0 border-t-0 border-transparent px-4 py-0 opacity-0 pointer-events-none"
          )}
        >
          <div className={cn("border-l-2 pl-2.5", currentCard.borderAccent)}>
            {/* Header: Badge, Title, Meta (▲ score · time) */}
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "shrink-0 px-1 text-[9px] font-bold leading-normal",
                    currentCard.badgeBg,
                    currentCard.badgeText
                  )}
                >
                  {currentCard.channel}
                </span>
                <span className="truncate font-bold text-[#EDEDF0]">{currentCard.title}</span>
              </span>
              <span className="shrink-0 font-mono text-[11px] flex items-center gap-1.5">
                <span className="text-[#27AD75]">{currentCard.score}</span>
                <span className="text-[#5C5C66]">·</span>
                <span className="text-[#8A8A94]">{currentCard.time}</span>
              </span>
            </div>

            {/* 2-Line Summary */}
            <div className="line-clamp-2 h-8 leading-normal text-[#8A8A94] mt-0.5">
              {currentCard.copy}
            </div>

            {/* Footer: URL and Domain */}
            <div className="flex items-baseline justify-between gap-3 text-[10px] mt-0.5">
              <span className="flex min-w-0 items-baseline">
                <span className="truncate text-[#818CF8]">↗ {currentCard.url}</span>
                <span className="ml-2 hidden shrink-0 text-[#5C5C66] sm:inline">
                  ⌘ click / /news
                </span>
              </span>
              <span className="shrink-0 text-[#5C5C66]">{currentCard.domain}</span>
            </div>
          </div>
        </div>

        {/* Input Prompt Line */}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 border-t border-[#1E1E22] px-4 py-2.5 focus-within:bg-[#111114] focus-within:shadow-[inset_2px_0_0_#D97757]"
        >
          <span className="sr-only">Type to prompt Claude Code</span>
          <span aria-hidden="true" className="text-[#D97757] font-bold text-sm select-none">
            &gt;
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="type anything to prompt Claude Code..."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={80}
            className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-[#EDEDF0] caret-[#D97757] outline-none terminal-prompt-input"
          />
          {!inputValue && (
            <span className="w-1.5 h-3.5 bg-[#D97757] animate-pulse shrink-0" aria-hidden="true" />
          )}
        </form>

        {/* Bottom Statusbar */}
        <div className="flex items-center justify-between border-t border-[#1E1E22] px-4 py-2 text-[9px] text-white/40 font-decima uppercase tracking-wider">
          <span>Claude Opus 5.5 · $0.04</span>
          <span>82% context</span>
        </div>
      </div>

      {/* Stepper below the terminal window */}
      <ol className="m-0 mt-3 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 font-mono text-[11px]">
        {STEP_LABELS.map((step, idx) => (
          <li key={step} className="flex items-center gap-2">
            {idx > 0 && (
              <span aria-hidden="true" className="text-[#8A8A94]/60">
                →
              </span>
            )}
            <span
              aria-current={activeStepIndices.includes(idx) ? "step" : undefined}
              className={cn(
                "border px-1.5 py-0.5 transition-colors",
                activeStepIndices.includes(idx)
                  ? "border-[#fcaa2d] text-[#EDEDF0]"
                  : "border-transparent text-[#9E9EA8]"
              )}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
