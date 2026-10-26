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
  reply: string;
}

const TECH_CARDS: TechCard[] = [
  {
    channel: "GH",
    badgeBg: "bg-[#27AD75]",
    badgeText: "text-[#0A0A0C]",
    borderAccent: "border-[#27AD75]",
    title: "vllm-project/vllm",
    score: "▲ 31.2k",
    time: "2h",
    copy: "High-throughput and memory-efficient LLM inference and serving engine. v0.6.3 released with FlashAttention-3 kernels.",
    url: "https://github.com/vllm-project/vllm",
    domain: "github.com",
  },
  {
    channel: "HN",
    badgeBg: "bg-[#fcaa2d]",
    badgeText: "text-[#0A0A0C]",
    borderAccent: "border-[#fcaa2d]",
    title: "SQLite in the browser with WebAssembly & OPFS",
    score: "▲ 1.4k",
    time: "3h",
    copy: "Official SQLite Wasm release brings ACID-compliant local database storage via Origin Private File System.",
    url: "https://sqlite.org/wasm",
    domain: "sqlite.org",
  },
  {
    channel: "DEV",
    badgeBg: "bg-[#8A63F4]",
    badgeText: "text-white",
    borderAccent: "border-[#8A63F4]",
    title: "Building a zero-copy AST parser in Rust",
    score: "▲ 420",
    time: "5h",
    copy: "Memory-efficient parsing patterns utilizing Rust string slices, lifetimes, and zero-allocation token trees.",
    url: "https://dev.to/rust-ast",
    domain: "dev.to",
  },
  {
    channel: "RED",
    badgeBg: "bg-[#FF4500]",
    badgeText: "text-white",
    borderAccent: "border-[#FF4500]",
    title: "r/programming · Rust 2024 edition stabilization",
    score: "▲ 892",
    time: "6h",
    copy: "Cargo resolver v3, async fn in traits enhancements, and RPITIT stabilization reach beta release.",
    url: "https://reddit.com/r/programming",
    domain: "reddit.com",
  },
];

const SCRIPTS: ScriptScenario[] = [
  {
    prompt: "refactor the wait-time pipeline and run tests",
    lines: [
      "Read   core/pipeline.ts",
      "Read   core/ticker.ts",
      "Edit   core/pipeline.ts  +38 −12",
      "Edit   core/ticker.ts    +14 −4",
      "Bash · vitest run tests/pipeline.test.ts",
      "  ✓ 53 tests passed (410 ms)",
      "  ✓ package integrity verified (12 ms)",
      "Bash · npx tsc --noEmit",
    ],
    reply: "looks good, now verify hide-on-type",
  },
  {
    prompt: "looks good, now verify hide-on-type",
    lines: [
      "Read   core/input-listener.ts",
      "Grep   unmountSlot  (1 match)",
      "Edit   core/input-listener.ts  +18 −2",
      "Bash · opencode reload",
      "  ✓ plugin reloaded in 82 ms",
      "Bash · vitest run tests/agy.test.ts",
      "  ✓ zero keystroke latency confirmed (0 ms)",
      "Bash · pnpm lint",
    ],
    reply: "ship it to OpenCode, AGY and Claude Code",
  },
  {
    prompt: "ship it to OpenCode, AGY and Claude Code",
    lines: [
      "Read   package.json",
      "Bash · npm run build",
      "  ✓ compiled waitfeed v1.1.0",
      "Bash · npx vitest run",
      "  ✓ 159 tests passed (0 errors)",
      "Done   WaitFeed active across all 3 agents",
    ],
    reply: "refactor the wait-time pipeline and run tests",
  },
];

const INITIAL_HISTORY = [
  "> git log -n 1 --oneline",
  "7f3a9d (HEAD -> main) feat: zero-overhead wait-state ticker",
  "> pnpm test:integrity",
  "  ✓ 159 unit tests passed across 7 suites",
];

const LINE_DELAYS = [500, 1000, 1600, 2200, 2900, 3700, 4400, 5200];
const STEP_LABELS = ["agent working", "ticker streaming", "you're typing"];

export function HeroTerminal() {
  const [history, setHistory] = useState<string[]>(INITIAL_HISTORY);
  const [status, setStatus] = useState<"working" | "typing">("working");
  const [prompt, setPrompt] = useState(SCRIPTS[0].prompt);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [visibleLineCount, setVisibleLineCount] = useState(5);
  const [cardIndex, setCardIndex] = useState(0);
  const [slotVisible, setSlotVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const timeAccumRef = useRef<number>(3400);
  const firedEventsRef = useRef<Set<string>>(new Set(["slot"]));
  const isVisibleRef = useRef<boolean>(true);
  const reducedMotionRef = useRef<boolean>(false);
  const userInteractingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scriptIndexRef = useRef<number>(0);

  const handleTypingStart = useCallback(() => {
    setSlotVisible(false);
    setStatus("typing");
  }, []);

  const handleSubmitPrompt = useCallback((newPrompt: string) => {
    timeAccumRef.current = 0;
    firedEventsRef.current = new Set(["slot"]);
    userInteractingRef.current = false;

    // Preserve the last prompt and last 2 completed lines into continuous history
    const prevScript = SCRIPTS[scriptIndexRef.current];
    setHistory([
      `> ${prevScript.prompt}`,
      ...prevScript.lines.slice(-2),
    ]);

    const nextIdx = (scriptIndexRef.current + 1) % SCRIPTS.length;
    scriptIndexRef.current = nextIdx;
    setScriptIndex(nextIdx);
    setPrompt(newPrompt);
    setInputValue("");
    setVisibleLineCount(0);
    setCardIndex((prev) => (prev + 1) % TECH_CARDS.length);
    setSlotVisible(true);
    setStatus("working");
  }, []);

  const scheduleResume = useCallback(
    (typedText: string) => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        const nextPrompt =
          typedText.trim().slice(0, 64) ||
          SCRIPTS[(scriptIndexRef.current + 1) % SCRIPTS.length].prompt;
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
        handleTypingStart();
      } else {
        setStatus("typing");
      }
      scheduleResume(val);
    },
    [slotVisible, handleTypingStart, scheduleResume]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      const nextPrompt =
        inputValue.trim().slice(0, 64) ||
        SCRIPTS[(scriptIndexRef.current + 1) % SCRIPTS.length].prompt;
      handleSubmitPrompt(nextPrompt);
    },
    [inputValue, handleSubmitPrompt]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotionRef.current) return;

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

    // Pre-populate so initial view has realistic terminal logs and ticker card
    timeAccumRef.current = 3400;
    firedEventsRef.current = new Set(["slot"]);
    for (let i = 0; i < 5; i++) {
      firedEventsRef.current.add(`line${i}`);
    }

    const interval = setInterval(() => {
      if (!isVisibleRef.current || userInteractingRef.current) return;

      timeAccumRef.current += 100;
      const currentScript = SCRIPTS[scriptIndexRef.current];

      trigger("slot", 200, () => {
        setSlotVisible(true);
        setStatus("working");
      });

      LINE_DELAYS.forEach((delay, idx) => {
        trigger(`line${idx}`, delay, () => setVisibleLineCount(idx + 1));
      });

      trigger("card1", 4200, () => setCardIndex((prev) => (prev + 1) % TECH_CARDS.length));

      for (let i = 0; i < currentScript.reply.length; i++) {
        trigger(`key${i}`, 6800 + 75 * i, () => {
          if (i === 0) handleTypingStart();
          setInputValue(currentScript.reply.slice(0, i + 1));
        });
      }

      trigger("enter", 6800 + 75 * currentScript.reply.length + 800, () => {
        handleSubmitPrompt(currentScript.reply);
      });
    }, 100);

    return () => {
      clearInterval(interval);
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [handleSubmitPrompt, handleTypingStart]);

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
          <div className="shrink-0 truncate text-[#EDEDF0]">
            <span className="mr-2 text-[#5C5C66]">&gt;</span>
            {prompt}
          </div>
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

      {/* Stepper below terminal matching distrotv */}
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
