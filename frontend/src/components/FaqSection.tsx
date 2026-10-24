"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/data";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="bg-(--bg-secondary) py-14 md:py-20 border-t border-(--rule-default)">
      <div className="mx-auto max-w-300 px-6">
        <div className="mb-10 max-w-[62ch]">
          <h2
            className="font-display text-[26px] md:text-[32px] leading-[1.15] tracking-[-0.02em] text-(--ink-primary) mb-3"
            style={{ fontWeight: 400 }}
          >
            Frequently Asked Questions
          </h2>
          <p className="font-body text-[15px] leading-[1.65] text-(--ink-secondary)">
            Everything you need to know about WaitFeed’s zero-cloud architecture, privacy boundaries, and TUI lifecycle.
          </p>
        </div>

        <div className="space-y-3 max-w-210">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-(--rule-default) bg-(--bg-surface) overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-data text-[13px] text-(--ink-primary) hover:bg-(--bg-surface-hover) transition-colors cursor-pointer select-none"
                >
                  <span className="font-medium pr-4">{item.question}</span>
                  <span className="font-mono text-[14px] text-(--ink-tertiary) shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    className="px-5 pb-5 pt-1 border-t border-(--rule-subtle) font-body text-[14px] leading-[1.65] text-(--ink-secondary)"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
