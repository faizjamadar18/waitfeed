"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";

interface FeedRow {
  source: string;
  content: string;
  refresh: string;
}

const ROWS: FeedRow[] = [
  { source: "HACKER NEWS", content: "TOP TECH DISCUSSIONS", refresh: "HOURLY" },
  { source: "GITHUB TRENDING", content: "TRENDING OPEN SOURCE TOOLS", refresh: "DAILY" },
  { source: "DEV.TO", content: "TUTORIALS & CODE GUIDES", refresh: "CONTINUOUS" },
  { source: "REDDIT", content: "DEVELOPER COMMUNITIES", refresh: "HOURLY" },
  { source: "TECH BLOGS", content: "ENGINEERING TEAM POSTS", refresh: "DAILY" },
  { source: "CUSTOM RSS", content: "ANY FEED OR BLOG YOU ADD", refresh: "REAL-TIME" },
];

// Timeline parameters from specification (10,000ms infinite loop)
const CYCLE_DURATION = 10000;
const ROW_OUTLINE_AT = [800, 2700, 3100, 3500, 3900, 4300];
const ROW_TEXT_AT = [950, 2850, 3250, 3650, 4050, 4450];
const ROW_ACTIVE_AT = [2000, 3600, 4300, 4900, 5300, 5700];
const ROW_DONE_AT = [4300, 4900, 5300, 5700, 6000, 6400];
const ROW_VANISH_AT = [9200, 9300, 9400, 9500, 9600, 9700];
const VANISH_DURATION = 250;

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot() {
  return false;
}

export function ModelsAndInfra() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reducedMotion) return;

    let animId: number;

    const tick = () => {
      const now = performance.now();
      if (startRef.current === null) {
        startRef.current = now;
      }
      const t = (now - startRef.current) % CYCLE_DURATION;
      setElapsed(t);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [inView, reducedMotion]);

  // If reduced motion, pin elapsed time to hold state (7000ms)
  const t = reducedMotion ? 7000 : elapsed;

  // Top border animation calculation (500-800ms draw in, 9200-9500ms fade out)
  let topBorderScale = 0;
  let topBorderOpacity = 0;
  if (t >= 500 && t < 800) {
    topBorderScale = Math.min((t - 500) / 300, 1);
    topBorderOpacity = 1;
  } else if (t >= 800 && t < 9200) {
    topBorderScale = 1;
    topBorderOpacity = 1;
  } else if (t >= 9200 && t < 9700) {
    topBorderScale = 1;
    topBorderOpacity = Math.max(0, 1 - (t - 9200) / 300);
  }

  return (
    <section
      id="sources"
      ref={sectionRef}
      className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]"
    >
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-6 sm:gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
            <span className="font-decima text-[10px] uppercase tracking-widest text-[#fcaa2d]">
              Live Sources &amp; Pipeline
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918] max-w-180">
            Developer intelligence from{" "}
            <strong className="font-display font-normal text-black">
              verifiable technical sources
            </strong>
          </h2>
          <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
            Streaming high-signal updates from Hacker News, GitHub Trending,
            Dev.to, and custom RSS. Synthesized strictly from technical metadata
            into 180-character briefs using your agent&apos;s local session with
            strict substance gates and zero hallucinations.
          </p>
        </div>

        {/* Visual: Single Sunset Mountain Ridge Background */}
        <div className="relative aspect-1596/900 min-h-110 sm:min-h-0 w-full rounded-xs overflow-hidden border border-[#e3e2d8] bg-[#f3f2e7]">
          <Image
            src="https://framerusercontent.com/images/Bj6BdvVC7GNAWhZbDFhJ2X9rTFI.webp?width=1596&height=900"
            alt="Mountain ridge at sunset with trees in the foreground"
            fill
            sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
            className="w-full h-full object-cover select-none"
          />

          {/* Centered Spec-Compliant Job Queue Table Panel (Zero Scrollbars) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] sm:w-[90%] max-w-200 select-none flex flex-col justify-start overflow-hidden"
            style={{
              backgroundColor: "rgba(245, 241, 230, 0.80)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              borderRadius: 0,
              padding: "16px 19px 16px 19px",
              height: "auto",
              boxShadow: "none",
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Table container with zero scrollbars */}
            <div className="w-full overflow-hidden scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="w-full">
                {/* 1) Header Row (Compact h-7 matching data rows, perfectly aligned) */}
                <div
                  className="grid w-full h-7 items-center text-[12px] sm:text-sm font-sans font-medium text-[#1a1a1a]"
                  style={{ gridTemplateColumns: "28% 34% 22% 16%" }}
                >
                  <div className="pl-2 sm:pl-2.75 pr-1 sm:pr-2 truncate">Source</div>
                  <div className="pl-2 sm:pl-2.75 pr-1 sm:pr-2 truncate">Content</div>
                  <div className="pl-2 sm:pl-2.75 pr-1 sm:pr-2 truncate">Refresh</div>
                  <div className="pl-2.5 sm:pl-2.5 pr-1 sm:pr-2 min-w-max">Status</div>
                </div>

                {/* Animated Top Border of the Table (scaleX 0 -> 1) */}
                <div
                  className="w-full h-px bg-[#1a1a1a]/85 transition-opacity duration-300"
                  style={{
                    transformOrigin: "left",
                    transform: `scaleX(${topBorderScale})`,
                    opacity: topBorderOpacity,
                  }}
                />

                {/* 2) Table Grid (Continuous 1px solid #1a1a1a/85 grid) */}
                <div className="w-full flex flex-col">
                  {ROWS.map((row, idx) => {
                    // 1. Outline fade-in & Vanish calculations
                    const outlineAt = ROW_OUTLINE_AT[idx];
                    const textAt = ROW_TEXT_AT[idx];
                    const activeAt = ROW_ACTIVE_AT[idx];
                    const doneAt = ROW_DONE_AT[idx];
                    const vanishAt = ROW_VANISH_AT[idx];

                    // Row outline opacity
                    let rowOpacity = 0;
                    if (t >= outlineAt && t < vanishAt) {
                      rowOpacity = Math.min((t - outlineAt) / 150, 1);
                    } else if (t >= vanishAt && t < vanishAt + VANISH_DURATION) {
                      rowOpacity = Math.max(0, 1 - (t - vanishAt) / VANISH_DURATION);
                    }

                    // Row text opacity
                    let textOpacity = 0;
                    if (t >= textAt && t < vanishAt) {
                      textOpacity = Math.min((t - textAt) / 200, 1);
                    } else if (t >= vanishAt && t < vanishAt + VANISH_DURATION) {
                      textOpacity = Math.max(0, 1 - (t - vanishAt) / VANISH_DURATION);
                    }

                    // 2. Exact Phase (Pure function of elapsed time t)
                    const isPending = t < activeAt;
                    const isActive = t >= activeAt && t < doneAt;
                    const isDone = t >= doneAt;
                    const isTickDrawn = isDone || (isActive && t >= activeAt + 120);

                    // 3. Roll swap progress (180ms ease-out)
                    const swapProgress = isPending
                      ? 0
                      : Math.min((t - activeAt) / 180, 1);

                    return (
                      <div
                        key={row.source}
                        className="grid w-full h-7 items-stretch border-l border-r border-b border-solid transition-[background-color,border-color] duration-280 ease-out relative"
                        style={{
                          gridTemplateColumns: "28% 34% 22% 16%",
                          borderColor: isActive ? "#FBA92C" : "rgba(26, 26, 26, 0.85)",
                          backgroundColor: isActive
                            ? "rgba(251, 169, 44, 0.28)"
                            : "transparent",
                          outline: isActive ? "1px solid #FBA92C" : "none",
                          outlineOffset: "-1px",
                          zIndex: isActive ? 10 : 1,
                          opacity: rowOpacity,
                          pointerEvents: rowOpacity === 0 ? "none" : "auto",
                        }}
                      >
                        {/* Source */}
                        <div
                          className={`h-full flex items-center pl-2 sm:pl-2.75 pr-1 sm:pr-2 border-r border-solid whitespace-nowrap uppercase text-[10px] sm:text-[11px] tracking-[0.08em] text-[#1a1a1a] truncate transition-[color,border-color] duration-280 ${isActive ? "font-bold" : "font-normal"
                            }`}
                          style={{
                            fontFamily:
                              "'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono', ui-monospace, monospace",
                            borderColor: isActive ? "#FBA92C" : "rgba(26, 26, 26, 0.85)",
                            opacity: textOpacity,
                          }}
                        >
                          {row.source}
                        </div>

                        {/* Content */}
                        <div
                          className={`h-full flex items-center pl-2 sm:pl-2.75 pr-1 sm:pr-2 border-r border-solid whitespace-nowrap uppercase text-[10px] sm:text-[11px] tracking-[0.08em] text-[#1a1a1a] truncate transition-[color,border-color] duration-280 ${isActive ? "font-bold" : "font-normal"
                            }`}
                          style={{
                            fontFamily:
                              "'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono', ui-monospace, monospace",
                            borderColor: isActive ? "#FBA92C" : "rgba(26, 26, 26, 0.85)",
                            opacity: textOpacity,
                          }}
                        >
                          {row.content}
                        </div>

                        {/* Refresh */}
                        <div
                          className={`h-full flex items-center pl-2 sm:pl-2.75 pr-1 sm:pr-2 border-r border-solid whitespace-nowrap uppercase text-[10px] sm:text-[11px] tracking-[0.08em] text-[#1a1a1a] truncate transition-[color,border-color] duration-280 ${isActive ? "font-bold" : "font-normal"
                            }`}
                          style={{
                            fontFamily:
                              "'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono', ui-monospace, monospace",
                            borderColor: isActive ? "#FBA92C" : "rgba(26, 26, 26, 0.85)",
                            opacity: textOpacity,
                          }}
                        >
                          {row.refresh}
                        </div>

                        {/* Status Cell (Full-bleed square rectangle, 0 border-radius, edge-to-edge) */}
                        <div
                          className="h-full p-0 overflow-hidden relative min-w-26"
                          style={{
                            backgroundColor: isPending
                              ? "transparent"
                              : isActive
                                ? "#FBA92C"
                                : "#1a1918",
                            transition: "background-color 280ms ease",
                          }}
                        >
                          {/* PENDING Layer (rolls down 16px and fades out) */}
                          <div
                            className="absolute inset-0 px-2.5 flex items-center gap-2 uppercase whitespace-nowrap select-none text-[#1a1a1a]/55 text-[10.5px] sm:text-[11px] tracking-[0.08em] font-normal"
                            style={{
                              fontFamily:
                                "'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono', ui-monospace, monospace",
                              opacity: Math.max(0, (1 - swapProgress) * textOpacity),
                              transform: `translateY(${swapProgress * 16}px)`,
                              pointerEvents: "none",
                            }}
                          >
                            <svg
                              className={`w-3 h-3 shrink-0 ${reducedMotion ? "" : "animate-spin"
                                }`}
                              style={{
                                animationDuration: "1s",
                                animationTimingFunction: "linear",
                              }}
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.25"
                            >
                              <line x1="8" y1="1.5" x2="8" y2="4.5" strokeLinecap="round" opacity="1" />
                              <line x1="8" y1="11.5" x2="8" y2="14.5" strokeLinecap="round" opacity="0.3" />
                              <line x1="1.5" y1="8" x2="4.5" y2="8" strokeLinecap="round" opacity="0.6" />
                              <line x1="11.5" y1="8" x2="14.5" y2="8" strokeLinecap="round" opacity="0.8" />
                              <line x1="3.4" y1="3.4" x2="5.5" y2="5.5" strokeLinecap="round" opacity="0.9" />
                              <line x1="10.5" y1="10.5" x2="12.6" y2="12.6" strokeLinecap="round" opacity="0.4" />
                              <line x1="3.4" y1="12.6" x2="5.5" y2="10.5" strokeLinecap="round" opacity="0.5" />
                              <line x1="10.5" y1="5.5" x2="12.6" y2="3.4" strokeLinecap="round" opacity="0.7" />
                            </svg>
                            <span>PENDING</span>
                          </div>

                          {/* SUCCEEDED Layer (rolls from -16px to 0 and fades in) */}
                          <div
                            className="absolute inset-0 px-2.5 flex items-center gap-2 uppercase whitespace-nowrap select-none text-[10.5px] sm:text-[11px] tracking-[0.08em] font-normal transition-colors duration-280"
                            style={{
                              fontFamily:
                                "'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono', ui-monospace, monospace",
                              opacity: Math.max(0, swapProgress * textOpacity),
                              transform: `translateY(${-16 + swapProgress * 16}px)`,
                              color: isDone ? "#EDE8DA" : "#1a1a1a",
                              pointerEvents: "none",
                            }}
                          >
                            <svg
                              className="w-3 h-3 shrink-0"
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="currentColor"
                            >
                              {/* Outlined square checkbox */}
                              <rect
                                x="1"
                                y="1"
                                width="12"
                                height="12"
                                rx="0.5"
                                strokeWidth="1.25"
                                stroke="currentColor"
                                fill="none"
                              />
                              {/* Checkmark tick */}
                              <path
                                d="M3.5 7.2L5.6 9.3L10.5 4.4"
                                strokeWidth="1.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                style={{
                                  strokeDasharray: 16,
                                  strokeDashoffset: isTickDrawn ? 0 : 16,
                                  opacity: isTickDrawn ? 1 : 0,
                                  transition:
                                    "stroke-dashoffset 180ms ease-out, opacity 180ms ease-out",
                                }}
                              />
                            </svg>
                            <span>SUCCEEDED</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
