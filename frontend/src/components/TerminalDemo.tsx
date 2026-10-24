"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { SAMPLE_STORIES, CHANNEL_COLORS, fmtScoreTui, type FeedItem } from "@/lib/data";

interface CodingScenario {
  prompt: string;
  lines: string[];
  reply: string;
}

const SCENARIOS: CodingScenario[] = [
  {
    prompt: "refactor the auth session cache and run test suite",
    lines: [
      "Read   src/auth/session.ts",
      "Read   src/auth/middleware.ts",
      "Edit   src/auth/session.ts  +38 −21",
      "Edit   src/auth/middleware.ts  +12 −9",
      "Bash · vitest run auth",
      "  ✓ session cache rotates on login (32 ms)",
      "  ✓ expired bearer token rejected (8 ms)",
      "Bash · vitest run suite",
    ],
    reply: "looks clean, now add rate limiting to api",
  },
  {
    prompt: "looks clean, now add rate limiting to api",
    lines: [
      "Read   src/routes/api/news.ts",
      "Grep   rateLimit  (0 matches)",
      "Edit   src/lib/rate-limit.ts  +45 −0",
      "Edit   src/routes/api/news.ts  +14 −3",
      "Bash · vitest run rate-limit",
      "  ✓ sixth attempt returns 429 Too Many Requests (19 ms)",
      "  ✓ sliding window resets after 60s (6 ms)",
      "Bash · opencode reload",
    ],
    reply: "optimize RSS XML parser and memory peak",
  },
  {
    prompt: "optimize RSS XML parser and memory peak",
    lines: [
      "Read   src/core/feeds.ts",
      "Read   src/core/rss-parser.ts",
      "Edit   src/core/rss-parser.ts  +31 −12",
      "Bash · node --test tests/feeds.test.ts",
      "  ✓ parses 500 items in 12ms (prev: 84ms)",
      "  ✓ memory peak stays under 24MB",
      "Bash · git status",
    ],
    reply: "refactor the auth session cache and run test suite",
  },
];

const LINE_DELAYS = [600, 1200, 1900, 2600, 3300, 4400, 5200, 6200];
const STEP_LABELS = ["agent working", "slot showing", "you're typing"];

export function TerminalDemo() {
  const [state, setState] = useState<"working" | "typing" | "prompt">("working");
  const [currentPrompt, setCurrentPrompt] = useState(SCENARIOS[0].prompt);
  const [visibleLinesCount, setVisibleLinesCount] = useState(5);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [slotShowing, setSlotShowing] = useState(true);
  const [inputText, setInputText] = useState("");
  const [clearLatency, setClearLatency] = useState<number | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [selectedReaderRow, setSelectedReaderRow] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tickRef = useRef<number>(3400);
  const firedEvents = useRef<Set<string>>(new Set(["slot"]));
  const isIntersecting = useRef(true);
  const prefersReducedMotion = useRef(false);
  const isUserInteracting = useRef(false);
  const announceLatency = useRef(false);
  const clearStartTime = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const activeScenarioIndex = useRef(0);

  // Fast latency measurement when slot clears on keystroke
  const handleClearSlot = useCallback((startTime: number, announce: boolean) => {
    clearStartTime.current = startTime;
    announceLatency.current = announce;
    setSlotShowing(false);
    setState("typing");
  }, []);

  useLayoutEffect(() => {
    if (slotShowing || clearStartTime.current === 0) return;
    const startTime = clearStartTime.current;
    clearStartTime.current = 0;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const elapsed = Math.max(1, Math.round(performance.now() - startTime));
        setClearLatency(elapsed);
        if (announceLatency.current) {
          setSrAnnouncement(`slot cleared in ${elapsed} milliseconds`);
        }
      }, 0);
    });
  }, [slotShowing]);

  // Submit command: user hits Enter or auto-loop advances
  const submitCommand = useCallback(
    (newPrompt?: string) => {
      tickRef.current = 0;
      firedEvents.current = new Set();
      isUserInteracting.current = false;

      if (newPrompt !== undefined && newPrompt.trim().length > 0) {
        if (newPrompt.trim() === "/news") {
          setIsReaderOpen(true);
          setInputText("");
          return;
        }
        activeScenarioIndex.current =
          (activeScenarioIndex.current + 1) % SCENARIOS.length;
        setScenarioIndex(activeScenarioIndex.current);
        setCurrentPrompt(newPrompt.trim());
      }

      setInputText("");
      setVisibleLinesCount(0);
      setStoryIndex((prev) => (prev + 1) % SAMPLE_STORIES.length);
      setSlotShowing(false);
      setState("working");
    },
    []
  );

  // Auto-submit after typing pause if user leaves typed text
  const scheduleAutoSubmit = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const trimmed = text.trim();
        const nextPrompt =
          trimmed.slice(0, 70) ||
          SCENARIOS[(activeScenarioIndex.current + 1) % SCENARIOS.length].prompt;

        if (prefersReducedMotion.current) {
          isUserInteracting.current = false;
          setInputText("");
          setCurrentPrompt(nextPrompt);
          setSlotShowing(true);
          setState("working");
          return;
        }
        submitCommand(nextPrompt);
      }, 2500);
    },
    [submitCommand]
  );

  // Interactive user typing handler (Keystroke detection)
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputText(val);
      isUserInteracting.current = true;

      if (slotShowing) {
        const timeStamp =
          e.nativeEvent.timeStamp > 0 ? e.nativeEvent.timeStamp : performance.now();
        handleClearSlot(timeStamp, true);
      } else {
        setState("typing");
      }

      scheduleAutoSubmit(val);
    },
    [slotShowing, handleClearSlot, scheduleAutoSubmit]
  );

  // Enter key submits immediately
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        const nextPrompt =
          inputText.trim() ||
          SCENARIOS[(activeScenarioIndex.current + 1) % SCENARIOS.length].prompt;
        submitCommand(nextPrompt);
      }
    },
    [inputText, submitCommand]
  );

  // Core Simulation Timeline (Observer + Interval Loop)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const cleanupDebounce = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };

    if (prefersReducedMotion.current) return cleanupDebounce;

    let isVisible = false;
    const updateVisibility = () => {
      isIntersecting.current = isVisible && document.visibilityState === "visible";
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", updateVisibility);

    const fireOnce = (eventKey: string, targetMs: number, action: () => void) => {
      if (
        tickRef.current >= targetMs &&
        !firedEvents.current.has(eventKey)
      ) {
        firedEvents.current.add(eventKey);
        action();
      }
    };

    // Prepopulate initial state so visitor immediately sees the live surface
    tickRef.current = 3400;
    firedEvents.current = new Set(["slot", "story0"]);
    for (let i = 0; i < 5; i++) {
      firedEvents.current.add(`line${i}`);
    }

    const timer = setInterval(() => {
      if (!isIntersecting.current || isUserInteracting.current) return;

      tickRef.current += 100;
      const currentScenario = SCENARIOS[activeScenarioIndex.current];

      // At 600ms after a command, the news slot pops up!
      fireOnce("slot", 600, () => {
        setSlotShowing(true);
        setState("working");
      });

      // Stream agent lines one by one
      LINE_DELAYS.forEach((delay, idx) => {
        fireOnce(`line${idx}`, delay, () => setVisibleLinesCount(idx + 1));
      });

      // Auto-type reply into the prompt input
      for (let t = 0; t < currentScenario.reply.length; t++) {
        fireOnce(`key${t}`, 8400 + 80 * t, () => {
          if (t === 0) {
            handleClearSlot(performance.now(), false);
          }
          setInputText(currentScenario.reply.slice(0, t + 1));
        });
      }

      // Enter / Submit command after user finishes typing
      fireOnce(
        "resume",
        8400 + 80 * currentScenario.reply.length + 1800,
        () => submitCommand(currentScenario.reply)
      );
    }, 100);

    return () => {
      clearInterval(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      cleanupDebounce();
    };
  }, [submitCommand, handleClearSlot]);

  // Stepper click controls
  const handleStepClick = (stepIndex: number, now: number) => {
    if (stepIndex === 0) {
      // agent working
      submitCommand(currentPrompt);
    } else if (stepIndex === 1) {
      // slot showing
      setSlotShowing(true);
      setState("working");
    } else if (stepIndex === 2) {
      // you're typing
      if (slotShowing) {
        handleClearSlot(now, true);
      }
      inputRef.current?.focus();
    }
  };

  const currentStory: FeedItem = SAMPLE_STORIES[storyIndex % SAMPLE_STORIES.length];
  const channelColor =
    CHANNEL_COLORS[currentStory.source] || "var(--accent-color)";
  const currentScenario = SCENARIOS[scenarioIndex];
  const visibleLines = currentScenario.lines.slice(0, visibleLinesCount);

  // Active steps calculation
  const activeSteps: number[] =
    state === "working"
      ? slotShowing
        ? [0, 1]
        : [0]
      : state === "typing"
      ? [2]
      : [];

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Demo: a news slot shows while the agent works and clears when you type"
      className="w-full"
    >
      {/* Terminal Container */}
      <div className="border border-(--rule-strong) bg-[#0A0A0C] font-data text-[12px] leading-normal text-[#EDEDF0] shadow-[0_12px_32px_rgba(14,14,17,0.12)]">
        {/* Terminal Header Bar */}
        <div className="flex items-center gap-1.5 border-b border-[#1E1E22] px-3 py-2 text-[10px] text-[#5C5C66]">
          <span className="h-2 w-2 rounded-full border border-[#3A3A40]"></span>
          <span className="h-2 w-2 rounded-full border border-[#3A3A40]"></span>
          <span className="h-2 w-2 rounded-full border border-[#3A3A40]"></span>
          <span className="ml-2 text-[#8A8A94]">surface 01 — terminal</span>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsReaderOpen((prev) => !prev)}
              className="text-[10px] text-[#8A8A94] hover:text-[#EDEDF0] transition-colors cursor-pointer border border-[#2D2D36] px-1.5 py-0.5"
              title="Toggle fullscreen reader"
            >
              {isReaderOpen ? "✕ close /news" : "/news"}
            </button>
            <span className="flex items-center gap-1.5 text-[#8A8A94]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#27AD75]"></span>
              live
            </span>
          </div>
        </div>

        {!isReaderOpen ? (
          <>
            {/* Agent Execution Log Stream */}
            <div
              aria-hidden="true"
              className="flex h-33 flex-col justify-end overflow-hidden px-4 pb-2 pt-3 sm:h-47"
            >
              <div className="shrink-0 truncate text-[#EDEDF0]">
                <span className="mr-2 text-[#5C5C66]">&gt;</span>
                {currentPrompt}
              </div>

              {visibleLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`shrink-0 truncate ${
                    line.startsWith("  ") ? "text-[#5C5C66]" : "text-[#8A8A94]"
                  }`}
                >
                  <span className="whitespace-pre">{line}</span>
                </div>
              ))}

              {state === "working" && (
                <div className="shrink-0 text-[#5C5C66]">
                  <span className="mr-2 inline-block animate-spin-slow text-(--accent-color)">
                    ⠋
                  </span>
                  working…
                </div>
              )}
            </div>

            {/* Interactive User Input Prompt */}
            <label className="flex items-center gap-2 border-t border-[#1E1E22] px-4 py-2.5 focus-within:bg-[#111114] focus-within:shadow-[inset_2px_0_0_var(--accent-color)] cursor-text">
              <span className="sr-only">Type to clear the slot</span>
              <span aria-hidden="true" className="text-[#5C5C66]">
                &gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="type anything to clear the slot, or enter a prompt…"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={80}
                className="min-w-0 flex-1 bg-transparent font-data text-[12px] text-[#EDEDF0] caret-(--accent-color) outline-none"
              />
              {inputText.length > 0 && (
                <span className="text-[10px] text-[#5C5C66] hidden sm:inline">
                  press ↵ to run
                </span>
              )}
            </label>

            {/* News Slot Container (h-23) */}
            <div className="h-23 border-t border-[#1E1E22] px-4 py-2.5 text-[11px]">
              {slotShowing ? (
                <div
                  className="border-l-2 pl-2.5 transition-colors duration-150"
                  style={{ borderColor: channelColor }}
                >
                  {/* Row 1: Source Badge + Title + Score */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="shrink-0 px-1 text-[9px] font-bold leading-normal text-[#0A0A0C] uppercase"
                        style={{ backgroundColor: channelColor }}
                      >
                        {currentStory.source}
                      </span>
                      <span className="truncate font-bold text-[#EDEDF0]">
                        {currentStory.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-[#5C5C66]">
                      {currentStory.score !== undefined && `▲ ${fmtScoreTui(currentStory.score)} · `}
                      {currentStory.ago}
                    </span>
                  </div>

                  {/* Row 2: Context / Story Summary (2 lines clamp) */}
                  <div className="line-clamp-2 h-8.25 leading-normal text-[#8A8A94]">
                    {currentStory.context}
                  </div>

                  {/* Row 3: Direct Link + Status */}
                  <div className="flex items-baseline justify-between gap-3 text-[10px]">
                    <span className="flex min-w-0 items-baseline">
                      <a
                        href={currentStory.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-[#8A8A94] transition-colors hover:text-[#EDEDF0] hover:underline"
                      >
                        {`  > `}
                        {currentStory.url}
                      </a>
                    </span>
                    <span className="shrink-0 text-[#5C5C66]">100% local</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center text-[#5C5C66]">
                  {clearLatency !== null && state === "typing" ? (
                    <span>
                      cleared in{" "}
                      <span className="text-[#EDEDF0] font-semibold">
                        {clearLatency} ms
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px]">
                      keystroke detected · ticker cleared
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Embedded Fullscreen Reader View */
          <div className="p-4 bg-[#0A0A0C] min-h-78">
            <div className="flex items-center justify-between border-b border-[#1E1E22] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-(--accent-color)">/news</span>
                <span className="text-[#8A8A94] text-[11px]">
                  WAITFEED — AI digests · 5 ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsReaderOpen(false)}
                className="text-[10px] text-[#8A8A94] hover:text-[#EDEDF0] px-1.5 py-0.5 border border-[#2D2D36]"
              >
                esc close
              </button>
            </div>

            <div className="mb-3 space-y-0.5 text-[10px] text-[#5C5C66]">
              <div>1 HN on · 2 DEV on · 3 GH on · 4 R/PROG on</div>
              <div>enter open · up/down move · f fullscreen · esc close</div>
            </div>

            <div className="space-y-1 mb-4">
              {SAMPLE_STORIES.map((story, idx) => {
                const isSelected = selectedReaderRow === idx;
                const badgeColor =
                  CHANNEL_COLORS[story.source] || "var(--accent-color)";
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedReaderRow(idx)}
                    className={`px-2 py-1.5 cursor-pointer text-[11px] transition-colors ${
                      isSelected
                        ? "bg-[#16161C] text-[#EDEDF0]"
                        : "text-[#8A8A94] hover:bg-[#121216] hover:text-[#EDEDF0]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#5C5C66] text-[10px]">
                        {isSelected ? "▸" : " "}
                      </span>
                      <span
                        className="px-1 text-[8px] font-bold text-[#0A0A0C] uppercase"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {story.source}
                      </span>
                      <span className="truncate flex-1 font-medium">
                        {story.title}
                      </span>
                      <span className="text-[10px] text-[#5C5C66]">
                        {story.score !== undefined && `▲ ${fmtScoreTui(story.score)} · `}
                        {story.ago}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-2 pl-4 border-l border-[#2D2D36] text-[#8A8A94] text-[11px]">
                        <p className="line-clamp-3">{story.context}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Screen Reader Announcement */}
      <span role="status" className="sr-only">
        {srAnnouncement}
      </span>

      {/* Stepper underneath terminal */}
      <ol className="m-0 mt-3 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 font-data text-[11px]">
        {STEP_LABELS.map((label, idx) => {
          const isActive = activeSteps.includes(idx);
          return (
            <li key={label} className="flex items-center gap-2">
              {idx > 0 && (
                <span aria-hidden="true" className="text-(--ink-tertiary)">
                  →
                </span>
              )}
              <button
                type="button"
                onClick={() => handleStepClick(idx, performance.now())}
                aria-current={isActive ? "step" : undefined}
                className={`border px-1.5 py-0.5 cursor-pointer transition-colors ${
                  isActive
                    ? "border-(--accent-color) text-(--ink-primary)"
                    : "border-transparent text-(--ink-tertiary) hover:text-(--ink-secondary)"
                }`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
