"use client";

import { useState } from "react";
import Image from "next/image";

interface TabItem {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

const TABS: TabItem[] = [
  {
    id: "repos",
    title: "Repos",
    description:
      "Source control designed for agents with light weight push/pull operations and no rate limits.",
    image:
      "https://framerusercontent.com/images/NdOBYD2jhpW5VmMwQGZpgXFqXw.svg?width=532&height=494",
    alt: "Branch centric",
  },
  {
    id: "retrieval",
    title: "Code Retrieval",
    description:
      "Agentic search that explores large codebases in parallel and answers in seconds.",
    image:
      "https://framerusercontent.com/images/CBYsFC0H5g0uprMiCJ7gFeJLoNY.svg?width=532&height=494",
    alt: "Fast agentic search F1 vs latency",
  },
  {
    id: "compact",
    title: "Compact",
    description:
      "Rewrites agent context at 50k+ tok/s, cutting token costs in half on long sessions.",
    image:
      "https://framerusercontent.com/images/759CqpnbHLpGTZQYja2sDmOIsdM.svg?width=532&height=494",
    alt: "Relace Compact token savings",
  },
];

export function EverythingYouNeed() {
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <section id="how-it-works" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10">
        {/* Top Decorative Border line */}
        <div className="w-full mb-10 overflow-hidden opacity-60">
          <Image
            src="https://framerusercontent.com/images/zrSbXqC7vlV7qMXli6g1lo7kbk.svg?width=1018&height=32"
            alt=""
            width={1018}
            height={32}
            className="w-full h-auto object-cover select-none"
            unoptimized
          />
        </div>

        {/* Section Heading */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-black">
            Everything you need for{" "}
            <strong className="font-display font-bold">autonomous</strong> codegen
          </h2>
        </div>

        {/* Interactive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 items-center">
          {/* Left: Tab list with timeline indicator */}
          <div className="relative pl-8 sm:pl-10">
            {/* Vertical timeline rule */}
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-[#191918]/15 border-dashed" />
            <div className="absolute left-1.5 top-0 w-2.5 h-2.5 rounded-full bg-[#191918]/25" />
            <div className="absolute left-1.5 bottom-0 w-2.5 h-2.5 rounded-full bg-[#191918]/25" />

            <div className="flex flex-col gap-8 sm:gap-10">
              {TABS.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className="relative text-left group cursor-pointer transition-all focus:outline-none"
                  >
                    {/* Active yellow dot / stroke indicator */}
                    {isActive && (
                      <span className="absolute -left-8 sm:-left-10 top-1.5 w-1.5 h-5 bg-[#fcaa2d] rounded-r-xs transition-all duration-300" />
                    )}

                    <h3
                      className={`text-lg sm:text-xl font-medium tracking-tight transition-colors ${
                        isActive
                          ? "text-[#191918]"
                          : "text-[#191918]/40 group-hover:text-[#191918]/70"
                      }`}
                    >
                      {tab.title}
                    </h3>

                    {/* Expandable description */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isActive
                          ? "max-h-24 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-sm sm:text-base text-[#191918]/70 font-parabole leading-relaxed">
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Diagram SVG */}
          <div className="relative aspect-532/494 w-full max-w-133 mx-auto rounded-xs overflow-hidden border border-[#e3e2d8] bg-[#f3f2e7]/50 p-4 sm:p-6 flex items-center justify-center">
            {TABS.map((tab, idx) => (
              <div
                key={tab.id}
                className={`absolute inset-4 sm:inset-6 transition-opacity duration-500 flex items-center justify-center ${
                  activeTab === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Image
                  src={tab.image}
                  alt={tab.alt}
                  width={532}
                  height={494}
                  className="w-full h-full object-contain select-none"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Decorative Border line */}
        <div className="w-full mt-14 sm:mt-20 overflow-hidden opacity-60">
          <Image
            src="https://framerusercontent.com/images/TB2DGULOnFPG9zuBavFwyqWZ2hw.svg?width=1024&height=32"
            alt=""
            width={1024}
            height={32}
            className="w-full h-auto object-cover select-none"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
