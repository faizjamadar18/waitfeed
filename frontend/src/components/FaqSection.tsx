"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  relaceViewport,
  transitionWithDelay,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "performance-tokens",
    question: "Will WaitFeed slow down my agent or use up tokens?",
    answer:
      "Zero tokens and zero slowdown. WaitFeed is purely observational—it never touches your prompts, tools, or agent context. Feeds are cached locally in the background so your agent runs at full speed.",
  },
  {
    id: "typing-interference",
    question: "Does the ticker get in the way when I type?",
    answer:
      "No. The ticker only displays while your agent is actively running. The moment you start typing or the agent finishes, it disappears immediately so your prompt stays clean.",
  },
  {
    id: "opening-links",
    question: "How do I open an article or read a story?",
    answer:
      "Click the link directly on the terminal card with Ctrl+Click (or Cmd+Click), or type /news to search recently displayed stories and press Enter to launch them in your browser.",
  },
  {
    id: "missed-headlines",
    question: "What if a headline disappears before I finish reading it?",
    answer:
      "Type /news. The reader keeps a dedicated 'Recently on Ticker' list right at the top showing the exact cards you just saw, so you can easily catch up on missed stories.",
  },
  {
    id: "custom-sources",
    question: "Can I choose which news sources appear?",
    answer:
      "Yes. Pick your preferred channels during npx waitfeed init, toggle them anytime in the /news sources menu, or add up to 10 custom RSS/Atom feeds in your config.",
  },
  {
    id: "uninstall-remove",
    question: "How do I uninstall WaitFeed or remove the ticker?",
    answer:
      "Just run npx waitfeed remove. It cleanly unregisters WaitFeed from all configured agents (OpenCode, Claude Code, and Antigravity), restores your original configuration files untouched, and deletes the local cache directory so nothing is left behind.",
  },
];

// Popular fluid easing curve (quintic ease-out used across modern design systems)
const DRAWER_EASE = [0.22, 1, 0.36, 1] as const;

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section id="faq" className="w-full pt-28 pb-0 px-5 sm:px-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-266 flex flex-col md:flex-row items-start justify-start gap-10 md:gap-0">
        {/* Left Column: Header (matches Relace #faq-header: flex: 1 0 0, 0 20px padding) */}
        <div className="w-full md:w-2/5 flex flex-col items-start gap-5 px-5 shrink-0">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={relaceViewport}
            transition={transitionWithDelay(0)}
            className="flex flex-row items-center gap-2.5"
          >
            <span className="w-1.5 h-1.25 bg-[#fcaa2d] shrink-0" />
            <span className="font-decima text-[10px] leading-[1.1] tracking-[0.03em] uppercase text-[#fcaa2d]">
              FAQs
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={relaceViewport}
            transition={transitionWithDelay(0.05)}
            className="text-[32px] sm:text-[36px] md:text-[40px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-black"
          >
            Frequently<br className="hidden md:inline" /> asked<br className="hidden md:inline" /> questions
          </motion.h2>
        </div>

        {/* Right Column: FAQ Accordion List (matches Relace #faq-list: flex: 3 0 0) */}
        <div className="w-full md:w-3/5 flex flex-col px-5 md:px-0">
          <motion.ul
            variants={staggerContainerVariants(0.06, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={relaceViewport}
            className="w-full flex flex-col border-b border-[#191918]/10 list-none p-0 m-0"
          >
            {FAQS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <motion.li
                  key={item.id}
                  variants={staggerItemVariants}
                  className="border-t border-[#191918]/10 w-full"
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    className="w-full py-6 flex items-center justify-between gap-3 text-left cursor-pointer group focus:outline-none"
                  >
                    <span className="font-parabole text-lg sm:text-xl font-medium leading-[1.06] tracking-[-0.03em] text-black">
                      {item.question}
                    </span>

                    {/* Plus / Minus indicator with smooth morph */}
                    <span className="relative w-6 h-6 flex items-center justify-center text-[#191918] shrink-0">
                      <span className="absolute w-3.5 h-[1.5px] bg-[#191918]" />
                      <motion.span
                        className="absolute w-3.5 h-[1.5px] bg-[#191918]"
                        initial={false}
                        animate={{
                          rotate: isOpen ? 0 : 90,
                          scale: isOpen ? 0 : 1,
                          opacity: isOpen ? 0 : 1,
                        }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                duration: isOpen ? 0.42 : 0.3,
                                ease: DRAWER_EASE,
                              }
                        }
                      />
                    </span>
                  </button>

                  {/* Smooth expanding drawer container */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : {
                            height: {
                              duration: isOpen ? 0.48 : 0.35,
                              ease: DRAWER_EASE,
                            },
                            opacity: {
                              duration: isOpen ? 0.38 : 0.2,
                              delay: isOpen ? 0.08 : 0,
                              ease: "easeInOut",
                            },
                          }
                    }
                    className="overflow-hidden"
                  >
                    <motion.div
                      animate={{
                        y: isOpen ? 0 : -8,
                      }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : {
                              duration: isOpen ? 0.45 : 0.25,
                              ease: DRAWER_EASE,
                            }
                      }
                      className="pb-6 pr-5 text-base font-parabole leading-normal text-[#191918]/60"
                    >
                      {item.answer}
                    </motion.div>
                  </motion.div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
