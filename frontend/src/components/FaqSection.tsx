"use client";

import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "what-updates",
    question: "What kind of updates does WaitFeed show?",
    answer:
      "Strictly technical content: trending open-source repositories, software releases, systems architecture breakdowns, and engineering discussions from Hacker News, GitHub Trending, Dev.to, and Reddit r/programming. There are zero mainstream news, political stories, or clickbait.",
  },
  {
    id: "hide-on-type",
    question: "How does the zero-latency hide mechanism work?",
    answer:
      "WaitFeed is completely observational. It renders in the line above your prompt input only while the agent is actively executing. The moment you press any key to type, the ticker unmounts in 0ms without intercepting, buffering, or delaying your keystrokes.",
  },
  {
    id: "supported-agents",
    question: "Which coding agents are supported?",
    answer:
      "WaitFeed natively supports OpenCode (via @opencode/plugin and OpenTUI Solid components), AGY / Google Antigravity (via CLI statusline hooks with wall-clock dwell timing), and Claude Code (via wait-state integration). All three share a single configuration.",
  },
  {
    id: "keys-and-backend",
    question: "Does WaitFeed require API keys, accounts, or a server?",
    answer:
      "None. WaitFeed is 100% local. All feed queries hit public keyless endpoints once every 30 minutes. Brief generation utilizes your existing agent's local session pipeline. No data ever leaves your computer.",
  },
  {
    id: "custom-feeds",
    question: "Can I add my own tech blogs and RSS feeds?",
    answer:
      "Yes. You can add up to 10 custom RSS/Atom URLs directly in ~/.config/waitfeed/config.json or during the npx waitfeed init setup. They render with a dedicated [RSS] badge.",
  },
  {
    id: "offline-behavior",
    question: "What happens if I'm offline or an upstream feed fails?",
    answer:
      "WaitFeed maintains a 60-card rolling pool in ~/.config/waitfeed/cache.json. Verified cards are retained for up to 36 hours. If you go offline or an upstream API is unreachable, the ticker quietly draws from cached briefs without failing your coding session.",
  },
];

export function FaqSection() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <section id="faq" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
            <span className="font-decima text-[10px] uppercase tracking-widest text-[#fcaa2d]">
              FAQs
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918]">
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion list */}
        <div className="flex flex-col border-b border-[#e3e2d8]">
          {FAQS.map((item) => {
            const isOpen = Boolean(openIds[item.id]);
            return (
              <div key={item.id} className="border-t border-[#e3e2d8]">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className="w-full py-6 sm:py-7 flex items-center justify-between gap-6 text-left group cursor-pointer focus:outline-none"
                >
                  <span className="text-lg sm:text-xl font-medium text-[#191918] font-parabole tracking-tight">
                    {item.question}
                  </span>

                  {/* Plus / Minus icon */}
                  <span className="relative w-4 h-4 flex items-center justify-center text-[#191918] shrink-0">
                    {/* Horizontal bar */}
                    <span className="absolute w-3.5 h-[1.5px] bg-[#191918]" />
                    {/* Vertical bar */}
                    <span
                      className={`absolute w-3.5 h-[1.5px] bg-[#191918] transition-transform duration-300 ease-out ${
                        isOpen ? "rotate-0 opacity-0" : "rotate-90 opacity-100"
                      }`}
                    />
                  </span>
                </button>

                {/* Animated Answer Body */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100 pb-7" : "max-h-0 opacity-0 pb-0"
                  }`}
                >
                  <p className="text-sm sm:text-base text-[#191918]/70 font-parabole leading-relaxed max-w-200">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
