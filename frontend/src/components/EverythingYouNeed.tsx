"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface AgentTab {
  id: string;
  name: string;
  description: string;
}

const TABS: AgentTab[] = [
  {
    id: "claude",
    name: "Claude Code",
    description:
      "Ambient developer stream during reasoning and tool runs. Clears instantly the millisecond you type.",
  },
  {
    id: "agy",
    name: "Antigravity",
    description:
      "Native statusline integration delivering high-signal briefs directly inside your agent loop.",
  },
  {
    id: "opencode",
    name: "OpenCode",
    description:
      "Reactive wait-state ticker docked right above the input prompt with zero keystroke latency.",
  },
];

const AGY_PIXELS = [
  { r: 0, c: 5, color: "#F2922E" }, { r: 0, c: 6, color: "#F07236" },
  { r: 1, c: 4, color: "#DBB131" }, { r: 1, c: 5, color: "#F6912E" }, { r: 1, c: 6, color: "#F37337" }, { r: 1, c: 7, color: "#F0583B" },
  { r: 2, c: 3, color: "#9EC345" }, { r: 2, c: 4, color: "#B5B43E" }, { r: 2, c: 5, color: "#E2993D" }, { r: 2, c: 6, color: "#F67A34" }, { r: 2, c: 7, color: "#F86A35" }, { r: 2, c: 8, color: "#EF5442" },
  { r: 3, c: 3, color: "#86C64E" }, { r: 3, c: 4, color: "#75B45E" }, { r: 3, c: 5, color: "#CC954D" }, { r: 3, c: 6, color: "#EF7947" }, { r: 3, c: 7, color: "#E16652" }, { r: 3, c: 8, color: "#E14F59" },
  { r: 4, c: 2, color: "#7CC251" }, { r: 4, c: 3, color: "#71C25C" }, { r: 4, c: 4, color: "#5CA98F" }, { r: 4, c: 5, color: "#5C91B3" }, { r: 4, c: 6, color: "#8373B0" }, { r: 4, c: 7, color: "#746FC3" }, { r: 4, c: 8, color: "#995DA8" }, { r: 4, c: 9, color: "#9C5B97" },
  { r: 5, c: 2, color: "#80C654" }, { r: 5, c: 3, color: "#54B881" }, { r: 5, c: 4, color: "#4097DE" }, { r: 5, c: 7, color: "#4A7EE4" }, { r: 5, c: 8, color: "#706ECE" }, { r: 5, c: 9, color: "#8F64B4" },
  { r: 6, c: 2, color: "#61C37D" }, { r: 6, c: 3, color: "#43AEAB" }, { r: 6, c: 8, color: "#4A80EA" }, { r: 6, c: 9, color: "#6C73D8" },
  { r: 7, c: 1, color: "#6DC694" }, { r: 7, c: 2, color: "#62BAD5" }, { r: 7, c: 3, color: "#47A8DC" }, { r: 7, c: 8, color: "#3D89FB" }, { r: 7, c: 9, color: "#4A81F0" }, { r: 7, c: 10, color: "#6579E1" },
  { r: 8, c: 1, color: "#6BC7A3" }, { r: 8, c: 2, color: "#64B6F6" }, { r: 8, c: 9, color: "#3886FB" }, { r: 8, c: 10, color: "#4881F4" },
  { r: 9, c: 0, color: "#67B9F4" }, { r: 9, c: 1, color: "#64B6F6" }, { r: 9, c: 10, color: "#3883F9" }, { r: 9, c: 11, color: "#3D85FC" },
];

const CLAUDE_ASCII = [
  " ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗",
  "██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝",
  "██║     ██║     ███████║██║   ██║██║  ██║█████╗  ",
  "██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ",
  "╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗",
  " ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝",
  " ██████╗  ██████╗  ██████╗  ███████╗             ",
  "██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝             ",
  "██║      ██║   ██║ ██║  ██║ █████╗               ",
  "██║      ██║   ██║ ██║  ██║ ██╔══╝               ",
  "╚██████╗ ╚██████╔╝ ██████╔╝ ███████╗             ",
  " ╚═════╝  ╚═════╝  ╚═════╝  ╚══════╝             ",
];

const OPENCODE_PIXELS = [
  { r: 0, c: 33, color: "#EEEEEE" },
  { r: 1, c: 0, color: "#808080" }, { r: 1, c: 1, color: "#808080" }, { r: 1, c: 2, color: "#808080" }, { r: 1, c: 3, color: "#808080" }, { r: 1, c: 5, color: "#808080" }, { r: 1, c: 6, color: "#808080" }, { r: 1, c: 7, color: "#808080" }, { r: 1, c: 8, color: "#808080" }, { r: 1, c: 10, color: "#808080" }, { r: 1, c: 11, color: "#808080" }, { r: 1, c: 12, color: "#808080" }, { r: 1, c: 13, color: "#808080" }, { r: 1, c: 15, color: "#808080" }, { r: 1, c: 16, color: "#808080" }, { r: 1, c: 17, color: "#808080" }, { r: 1, c: 20, color: "#EEEEEE" }, { r: 1, c: 21, color: "#EEEEEE" }, { r: 1, c: 22, color: "#EEEEEE" }, { r: 1, c: 23, color: "#EEEEEE" }, { r: 1, c: 25, color: "#EEEEEE" }, { r: 1, c: 26, color: "#EEEEEE" }, { r: 1, c: 27, color: "#EEEEEE" }, { r: 1, c: 28, color: "#EEEEEE" }, { r: 1, c: 30, color: "#EEEEEE" }, { r: 1, c: 31, color: "#EEEEEE" }, { r: 1, c: 32, color: "#EEEEEE" }, { r: 1, c: 33, color: "#EEEEEE" }, { r: 1, c: 35, color: "#EEEEEE" }, { r: 1, c: 36, color: "#EEEEEE" }, { r: 1, c: 37, color: "#EEEEEE" }, { r: 1, c: 38, color: "#EEEEEE" },
  { r: 2, c: 0, color: "#808080" }, { r: 2, c: 3, color: "#808080" }, { r: 2, c: 5, color: "#808080" }, { r: 2, c: 8, color: "#808080" }, { r: 2, c: 10, color: "#808080" }, { r: 2, c: 13, color: "#808080" }, { r: 2, c: 15, color: "#808080" }, { r: 2, c: 18, color: "#808080" }, { r: 2, c: 20, color: "#EEEEEE" }, { r: 2, c: 25, color: "#EEEEEE" }, { r: 2, c: 28, color: "#EEEEEE" }, { r: 2, c: 30, color: "#EEEEEE" }, { r: 2, c: 33, color: "#EEEEEE" }, { r: 2, c: 35, color: "#EEEEEE" }, { r: 2, c: 38, color: "#EEEEEE" },
  { r: 3, c: 0, color: "#808080" }, { r: 3, c: 1, color: "#282828" }, { r: 3, c: 2, color: "#282828" }, { r: 3, c: 3, color: "#808080" }, { r: 3, c: 5, color: "#808080" }, { r: 3, c: 6, color: "#282828" }, { r: 3, c: 7, color: "#282828" }, { r: 3, c: 8, color: "#808080" }, { r: 3, c: 10, color: "#808080" }, { r: 3, c: 11, color: "#808080" }, { r: 3, c: 12, color: "#808080" }, { r: 3, c: 13, color: "#808080" }, { r: 3, c: 15, color: "#808080" }, { r: 3, c: 16, color: "#282828" }, { r: 3, c: 17, color: "#282828" }, { r: 3, c: 18, color: "#808080" }, { r: 3, c: 20, color: "#EEEEEE" }, { r: 3, c: 21, color: "#434343" }, { r: 3, c: 22, color: "#434343" }, { r: 3, c: 23, color: "#434343" }, { r: 3, c: 25, color: "#EEEEEE" }, { r: 3, c: 26, color: "#434343" }, { r: 3, c: 27, color: "#434343" }, { r: 3, c: 28, color: "#EEEEEE" }, { r: 3, c: 30, color: "#EEEEEE" }, { r: 3, c: 31, color: "#434343" }, { r: 3, c: 32, color: "#434343" }, { r: 3, c: 33, color: "#EEEEEE" }, { r: 3, c: 35, color: "#EEEEEE" }, { r: 3, c: 36, color: "#EEEEEE" }, { r: 3, c: 37, color: "#EEEEEE" }, { r: 3, c: 38, color: "#EEEEEE" },
  { r: 4, c: 0, color: "#808080" }, { r: 4, c: 1, color: "#282828" }, { r: 4, c: 2, color: "#282828" }, { r: 4, c: 3, color: "#808080" }, { r: 4, c: 5, color: "#808080" }, { r: 4, c: 6, color: "#282828" }, { r: 4, c: 7, color: "#282828" }, { r: 4, c: 8, color: "#808080" }, { r: 4, c: 10, color: "#808080" }, { r: 4, c: 11, color: "#282828" }, { r: 4, c: 12, color: "#282828" }, { r: 4, c: 13, color: "#282828" }, { r: 4, c: 15, color: "#808080" }, { r: 4, c: 16, color: "#282828" }, { r: 4, c: 17, color: "#282828" }, { r: 4, c: 18, color: "#808080" }, { r: 4, c: 20, color: "#EEEEEE" }, { r: 4, c: 21, color: "#434343" }, { r: 4, c: 22, color: "#434343" }, { r: 4, c: 23, color: "#434343" }, { r: 4, c: 25, color: "#EEEEEE" }, { r: 4, c: 26, color: "#434343" }, { r: 4, c: 27, color: "#434343" }, { r: 4, c: 28, color: "#EEEEEE" }, { r: 4, c: 30, color: "#EEEEEE" }, { r: 4, c: 31, color: "#434343" }, { r: 4, c: 32, color: "#434343" }, { r: 4, c: 33, color: "#EEEEEE" }, { r: 4, c: 35, color: "#EEEEEE" }, { r: 4, c: 36, color: "#434343" }, { r: 4, c: 37, color: "#434343" }, { r: 4, c: 38, color: "#434343" },
  { r: 5, c: 0, color: "#808080" }, { r: 5, c: 1, color: "#808080" }, { r: 5, c: 2, color: "#808080" }, { r: 5, c: 3, color: "#808080" }, { r: 5, c: 5, color: "#808080" }, { r: 5, c: 6, color: "#808080" }, { r: 5, c: 7, color: "#808080" }, { r: 5, c: 8, color: "#808080" }, { r: 5, c: 10, color: "#808080" }, { r: 5, c: 11, color: "#808080" }, { r: 5, c: 12, color: "#808080" }, { r: 5, c: 13, color: "#808080" }, { r: 5, c: 15, color: "#808080" }, { r: 5, c: 16, color: "#282828" }, { r: 5, c: 17, color: "#282828" }, { r: 5, c: 18, color: "#808080" }, { r: 5, c: 20, color: "#EEEEEE" }, { r: 5, c: 21, color: "#EEEEEE" }, { r: 5, c: 22, color: "#EEEEEE" }, { r: 5, c: 23, color: "#EEEEEE" }, { r: 5, c: 25, color: "#EEEEEE" }, { r: 5, c: 26, color: "#EEEEEE" }, { r: 5, c: 27, color: "#EEEEEE" }, { r: 5, c: 28, color: "#EEEEEE" }, { r: 5, c: 30, color: "#EEEEEE" }, { r: 5, c: 31, color: "#EEEEEE" }, { r: 5, c: 32, color: "#EEEEEE" }, { r: 5, c: 33, color: "#EEEEEE" }, { r: 5, c: 35, color: "#EEEEEE" }, { r: 5, c: 36, color: "#EEEEEE" }, { r: 5, c: 37, color: "#EEEEEE" }, { r: 5, c: 38, color: "#EEEEEE" },
  { r: 6, c: 5, color: "#808080" },
];

export function EverythingYouNeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const isClickingRef = useRef<boolean>(false);
  const indicatorTop =
    activeTab === 0
      ? "14px"
      : activeTab === 1
        ? "65px"
        : "116px";

  useEffect(() => {
    let animationFrameId: number;

    function handleScroll() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(Math.max(currentScroll / totalScrollable, 0), 1);
      setScrollProgress(progress);

      if (!isClickingRef.current) {
        if (progress < 0.35) {
          setActiveTab(0);
        } else if (progress < 0.68) {
          setActiveTab(1);
        } else {
          setActiveTab(2);
        }
      }
    }

    function onScrollThrottled() {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    }

    window.addEventListener("scroll", onScrollThrottled, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScrollThrottled);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  function handleTabClick(index: number) {
    setActiveTab(index);
    if (!containerRef.current) return;

    isClickingRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

    const targetFraction = index === 0 ? 0.05 : index === 1 ? 0.5 : 0.9;
    const targetScrollY = containerTop + totalScrollable * targetFraction;

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });

    setTimeout(() => {
      isClickingRef.current = false;
    }, 700);
  }

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative w-full border-t border-[#e3e2d8]"
      style={{ height: "260vh" }}
    >
      {/* Pinned Sticky Viewport Window */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        <div className="w-full max-w-266 mx-auto px-5 sm:px-10 flex flex-col justify-between py-6 h-full max-h-205">
          {/* Top Decorative Border track */}
          <div className="w-full flex flex-col gap-2 flex-none">
            <div className="flex items-center justify-between text-[10px] font-decima text-[#191918]/50 uppercase tracking-widest px-1">
              <span>
                {activeTab === 0
                  ? "FIG. 001 · CLAUDE CODE INTEGRATION"
                  : activeTab === 1
                    ? "FIG. 002 · ANTIGRAVITY STATUSLINE"
                    : "FIG. 003 · OPENCODE COMPOSER"}
              </span>
              <span>RUNTIME ADAPTERS</span>
            </div>
            <div className="w-full h-8 overflow-hidden relative opacity-70 border-b border-[#e3e2d8]">
              <div
                className="absolute inset-y-0 flex items-center will-change-transform transition-transform duration-100 ease-out"
                style={{
                  transform: `translateX(${-scrollProgress * 120}px)`,
                }}
              >
                <Image
                  src="https://framerusercontent.com/images/zrSbXqC7vlV7qMXli6g1lo7kbk.svg?width=1018&height=32"
                  alt=""
                  width={1018}
                  height={32}
                  className="h-8 w-auto object-cover select-none shrink-0"
                  unoptimized
                />
                <Image
                  src="https://framerusercontent.com/images/TB2DGULOnFPG9zuBavFwyqWZ2hw.svg?width=1024&height=32"
                  alt=""
                  width={1024}
                  height={32}
                  className="h-8 w-auto object-cover select-none shrink-0"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-center py-4 sm:py-6">
            {/* Two Column Layout: Left Column (Heading + Rail Tabs), Right Column (Terminal Preview) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">
              {/* Left Column: Heading + Interactive Agent Tabs (Strictly anchored at top) */}
              <div className="flex flex-col justify-start items-start">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-parabole font-normal leading-[1.12] tracking-[-0.035em] text-[#191918] mb-8 sm:mb-10 shrink-0">
                  Native integration across your <br className="hidden sm:inline" />
                  <strong className="font-display font-normal text-black">agent of choice</strong>
                </h2>

                {/* Interactive Agent Tabs with Vertical Rail */}
                <div className="relative pl-7 sm:pl-9 py-1 w-full min-h-48.75">
                  {/* Background Vertical Dotted Rail Track (Constant fixed height, never stretches/shrinks) */}
                  <div className="absolute left-0.75 -translate-x-1/2 top-3.5 h-41.5 w-px border-l-2 border-dotted border-[#191918]/25 pointer-events-none" />

                  {/* Top Terminal Dot */}
                  <div
                    className={`absolute left-0.75 top-3.5 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors duration-300 pointer-events-none ${activeTab === 0 ? "bg-[#fcaa2d]" : "bg-[#BDBDB6]"
                      }`}
                  />

                  {/* Bottom Terminal Dot */}
                  <div
                    className={`absolute left-0.75 top-45 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors duration-300 pointer-events-none ${activeTab === 2 ? "bg-[#fcaa2d]" : "bg-[#BDBDB6]"
                      }`}
                  />

                  {/* Sliding Active Amber Indicator Segment (Constant 64px height, glides smoothly) */}
                  <div
                    className="absolute left-0.75 -translate-x-1/2 w-0.5 h-16 bg-[#fcaa2d] rounded-full transition-all duration-400 ease-out pointer-events-none"
                    style={{ top: indicatorTop }}
                  />

                  {/* Tabs List */}
                  <div className="flex flex-col gap-6 sm:gap-7">
                    {TABS.map((tab, idx) => {
                      const isActive = activeTab === idx;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleTabClick(idx)}
                          className="text-left group cursor-pointer focus:outline-none"
                        >
                          <h3
                            className={`text-lg sm:text-xl font-medium tracking-tight transition-colors duration-200 ${isActive
                                ? "text-[#191918]"
                                : "text-[#191918]/45 group-hover:text-[#191918]/80"
                              }`}
                          >
                            {tab.name}
                          </h3>

                          {/* Expandable description */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${isActive
                                ? "max-h-24 opacity-100 mt-2 sm:mt-2.5"
                                : "max-h-0 opacity-0 mt-0"
                              }`}
                          >
                            <p className="text-sm sm:text-[15px] text-[#191918]/65 font-parabole leading-relaxed max-w-md">
                              {tab.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: High-Definition Vector Terminal Window */}
              <div className="relative w-full max-w-133 mx-auto min-h-98 sm:min-h-102 rounded-xs overflow-hidden border border-[#1E1E22] bg-[#0A0A0C] p-3.5 sm:p-4 flex flex-col justify-between text-white font-mono shadow-2xl select-none">
                {/* Top Window Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#1E1E22] text-[10px] text-[#5C5C66]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#8A9397]" />
                    <span className="h-2 w-2 rounded-full bg-[#8A9397]" />
                    <span className="h-2 w-2 rounded-full bg-[#8A9397]" />
                    <div className="relative h-4 overflow-hidden ml-2 flex-1 w-48">
                      {TABS.map((tab, idx) => (
                        <span
                          key={tab.id}
                          className={`absolute left-0 top-0 text-[#8A8A94] transition-all duration-300 ease-out ${activeTab === idx
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 -translate-y-2 pointer-events-none"
                            }`}
                        >
                          {idx === 0
                            ? "claude · ~/projects/waitfeed"
                            : idx === 1
                              ? "antigravity · ~/projects/waitfeed"
                              : "opencode · ~/projects/waitfeed"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[#8A8A94]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#27AD75]" />
                    live
                  </span>
                </div>

                {/* Terminal Views Layered Stack (Smooth Crossfade & Slide Transition) */}
                <div className="relative flex-1 w-full my-1 min-h-75 sm:min-h-78 overflow-hidden">
                  {/* TAB 0: CLAUDE CODE */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-between pt-1 text-xs leading-relaxed transition-all duration-500 ease-out ${activeTab === 0
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                      }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Welcome Box */}
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] border border-[#D97757]/40 bg-[#D97757]/10 text-[#D97757] text-[10px]">
                          <span>✳</span> Welcome to Claude Code
                        </span>
                      </div>

                      {/* Authentic ANSI Shadow ASCII Art for CLAUDE CODE */}
                      <div className="py-0.5 overflow-hidden">
                        <pre className="font-mono text-[#D97757] text-[7.5px] sm:text-[8.5px] leading-[1.05] font-bold select-none tracking-tight">
                          {CLAUDE_ASCII.join("\n")}
                        </pre>
                      </div>
                    </div>

                    {/* Bottom Area: WaitFeed Slot STUCK directly above Prompt Line */}
                    <div className="mt-auto flex flex-col gap-1.5 pt-1.5 pb-1">
                      {/* Active wait-state indicator */}
                      <div className="flex items-center gap-2 text-[10px] text-[#8A8A94]">
                        <span className="inline-block animate-spin text-[#D97757]">⠋</span>
                        <span>thinking &amp; analyzing codebase…</span>
                        <span className="ml-auto font-mono text-[9px] text-[#D97757]">wait-state active</span>
                      </div>

                      {/* WaitFeed Wait-State Slot */}
                      <div className="rounded-xs border border-[#1E1E22] bg-[#0d0d0f] p-2 sm:p-2.5 flex flex-col gap-1 border-l-2 border-l-[#27AD75]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="bg-[#27AD75] text-[#0A0A0C] px-1 text-[9px] font-bold">
                              GH
                            </span>
                            <span className="text-[#EDEDF0] truncate">vllm-project/vllm</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-[#27AD75]">
                            ▲ 31.2k · 2h
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#8A8A94] line-clamp-2">
                          Fast LLM serving engine. PagedAttention memory management achieves 24x higher throughput.
                        </p>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#5C5C66]">
                          <span className="text-[#818CF8]">↗ github.com/vllm-project/vllm</span>
                          <span>wait-state stream</span>
                        </div>
                      </div>

                      {/* Claude Prompt Line */}
                      <div className="flex items-center gap-2 text-xs text-[#5C5C66] pt-1.5 border-t border-[#1E1E22]">
                        <span className="text-[#D97757] font-bold text-sm">&gt;</span>
                        <span className="text-white/40">type anything to prompt Claude Code...</span>
                        <span className="w-1.5 h-3.5 bg-[#D97757] animate-pulse ml-auto" />
                      </div>
                    </div>
                  </div>

                  {/* TAB 1: ANTIGRAVITY */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-between pt-1 text-xs leading-relaxed transition-all duration-500 ease-out ${activeTab === 1
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                      }`}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Antigravity Rainbow Pixel "A" Logo Banner */}
                      <div className="py-1">
                        <svg
                          viewBox="0 0 108 110"
                          className="w-20 h-20 sm:w-24 sm:h-24"
                          shapeRendering="crispEdges"
                          aria-label="Antigravity Rainbow Logo"
                        >
                          {AGY_PIXELS.map((p, idx) => (
                            <rect
                              key={idx}
                              x={p.c * 9}
                              y={p.r * 11}
                              width={9}
                              height={11}
                              fill={p.color}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* Welcome to Antigravity! */}
                      <div className="text-xs sm:text-sm font-bold tracking-tight font-mono">
                        <span className="text-[#EDEDF0]">Welcome to </span>
                        <span className="text-[#58A6FF]">Antigravity!</span>
                      </div>
                    </div>

                    {/* Bottom Area: WaitFeed Slot STUCK directly above Prompt Line */}
                    <div className="mt-auto flex flex-col gap-1.5 pt-1.5 pb-1">
                      {/* Active wait-state indicator */}
                      <div className="flex items-center gap-2 text-[10px] text-[#8A8A94]">
                        <span className="inline-block animate-spin text-[#58A6FF]">⠋</span>
                        <span>running tool calls &amp; reasoning…</span>
                        <span className="ml-auto font-mono text-[9px] text-[#58A6FF]">wait-state active</span>
                      </div>

                      {/* WaitFeed Statusline Hook Card */}
                      <div className="rounded-xs border border-[#1E1E22] bg-[#0d0d0f] p-2 sm:p-2.5 flex flex-col gap-1 border-l-2 border-l-[#fcaa2d]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="bg-[#fcaa2d] text-[#0A0A0C] px-1 text-[9px] font-bold">
                              HN
                            </span>
                            <span className="text-[#EDEDF0] truncate">
                              SQLite with WebAssembly &amp; OPFS
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-[#27AD75]">
                            ▲ 1.4k · 3h
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#8A8A94] line-clamp-2">
                          Official SQLite Wasm release brings ACID-compliant local database storage via OPFS.
                        </p>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#5C5C66]">
                          <span className="text-[#818CF8]">↗ sqlite.org/wasm</span>
                          <span>dwell clock: 20s</span>
                        </div>
                      </div>

                      {/* AGY Prompt Line */}
                      <div className="flex items-center gap-2 text-xs text-[#5C5C66] pt-1.5 border-t border-[#1E1E22]">
                        <span className="text-[#58A6FF] font-bold text-sm">&gt;</span>
                        <span className="text-white/40">type prompt...</span>
                        <span className="w-1.5 h-3.5 bg-[#58A6FF] animate-pulse ml-auto" />
                      </div>
                    </div>
                  </div>

                  {/* TAB 2: OPENCODE */}
                  <div
                    className={`absolute inset-0 flex flex-col justify-between pt-1 text-xs leading-relaxed transition-all duration-500 ease-out ${activeTab === 2
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"
                      }`}
                  >
                    <div className="flex flex-col">
                      {/* Official OpenCode Wordmark Banner */}
                      <div className="py-1">
                        <svg
                          viewBox="0 0 351 77"
                          className="w-full max-w-60 sm:max-w-68 h-auto"
                          shapeRendering="crispEdges"
                          aria-label="OpenCode Logo"
                        >
                          {OPENCODE_PIXELS.map((p, idx) => (
                            <rect
                              key={idx}
                              x={p.c * 9}
                              y={p.r * 11}
                              width={9}
                              height={11}
                              fill={p.color}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* OpenCode Slogan / Subtitle */}
                      <p className="font-mono text-[9px] sm:text-[10px] text-[#7A7A85] tracking-wider uppercase select-none">
                        THE AI CODING AGENT BUILT FOR THE TERMINAL
                      </p>

                      {/* OpenCode Execution Logs */}
                      <div className="flex flex-col gap-1.5 pt-6 font-mono text-[11px] select-none">
                        <div className="flex items-center gap-2 text-[#8A8A94]">
                          <span className="flex items-center gap-2">
                            <span className="text-[#3fb950]">✓</span>
                            <span className="text-[#EDEDF0]">Read</span>
                            <span className="text-[#8A8A94]">core/parser.rs</span>
                          </span>
                          <span className="text-[10px] text-[#5C5C66]">142 lines</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#8A8A94]">
                          <span className="flex items-center gap-2">
                            <span className="text-[#3fb950]">✓</span>
                            <span className="text-[#EDEDF0]">Edit</span>
                            <span className="text-[#8A8A94]">core/parser.rs</span>
                          </span>
                          <span className="text-[10px] font-mono">
                            <span className="text-[#3fb950]">+38</span>{" "}
                            <span className="text-[#F85149]">−12</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Area: WaitFeed Slot STUCK directly above Prompt Line */}
                    <div className="mt-auto flex flex-col gap-1.5 pt-1.5 pb-1">
                      {/* Active wait-state indicator */}
                      <div className="flex items-center gap-2 text-[10px] text-[#8A8A94]">
                        <span className="inline-block animate-spin text-[#3fb950]">⠋</span>
                        <span>thinking &amp; analyzing codebase…</span>
                        <span className="ml-auto font-mono text-[9px] text-[#3fb950]">wait-state active</span>
                      </div>

                      {/* WaitFeed Reactive OpenTUI Slot */}
                      <div className="rounded-xs border border-[#1E1E22] bg-[#0d0d0f] p-2 sm:p-2.5 flex flex-col gap-1 border-l-2 border-l-[#8A63F4]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="bg-[#8A63F4] text-white px-1 text-[9px] font-bold">
                              DEV
                            </span>
                            <span className="text-[#EDEDF0] truncate">
                              Zero-copy AST parser in Rust
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-[#27AD75]">
                            ▲ 420 · 5h
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#8A8A94] line-clamp-2">
                          Memory-efficient parsing patterns utilizing Rust string slices, lifetimes, and zero-allocation token trees.
                        </p>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#5C5C66]">
                          <span className="text-[#818CF8]">↗ dev.to/rust-ast</span>
                          <span>OpenTUI Solid reactive</span>
                        </div>
                      </div>

                      {/* OpenCode Prompt Line */}
                      <div className="flex items-center gap-2 text-xs text-[#5C5C66] pt-1.5 border-t border-[#1E1E22]">
                        <span className="text-[#3fb950] font-bold text-sm">&gt;</span>
                        <span className="text-white/40">Type your prompt...</span>
                        <span className="w-1.5 h-3.5 bg-[#3fb950] animate-pulse ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Statusbar */}
                <div className="pt-2 border-t border-[#1E1E22] flex items-center justify-between text-[9px] text-white/40 font-decima uppercase tracking-wider relative h-6">
                  {TABS.map((tab, idx) => (
                    <div
                      key={tab.id}
                      className={`absolute inset-x-0 top-1.5 flex items-center justify-between transition-all duration-300 ease-out ${activeTab === idx
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-1 pointer-events-none"
                        }`}
                    >
                      <span>
                        {idx === 0
                          ? "Claude Opus 5.5 · $0.04"
                          : idx === 1
                            ? "? for shortcuts"
                            : "OpenTUI Solid v2.4"}
                      </span>
                      <span>
                        {idx === 0
                          ? "82% context"
                          : idx === 1
                            ? "Gemini Argon 4 · high"
                            : "53 tests passed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Decorative Border track */}
          <div className="w-full h-8 overflow-hidden relative opacity-70 border-t border-[#e3e2d8] flex-none">
            <div
              className="absolute inset-y-0 flex items-center will-change-transform transition-transform duration-100 ease-out"
              style={{
                transform: `translateX(${scrollProgress * 100 - 100}px)`,
              }}
            >
              <Image
                src="https://framerusercontent.com/images/TB2DGULOnFPG9zuBavFwyqWZ2hw.svg?width=1024&height=32"
                alt=""
                width={1024}
                height={32}
                className="h-8 w-auto object-cover select-none shrink-0"
                unoptimized
              />
              <Image
                src="https://framerusercontent.com/images/zrSbXqC7vlV7qMXli6g1lo7kbk.svg?width=1018&height=32"
                alt=""
                width={1018}
                height={32}
                className="h-8 w-auto object-cover select-none shrink-0"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
