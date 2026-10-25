"use client";

import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "why-relace",
    question: "Why Relace?",
    answer:
      "Relace is purpose-built for coding workflows. Instead of relying on general-purpose LLMs, our in-house models specialize in retrieval, merging, and code generation — making them faster, more reliable, and easier to integrate into engineering pipelines. Teams use Relace to cut down errors, accelerate development, and gain a real competitive edge.",
  },
  {
    id: "soc2",
    question: "Is Relace SOC 2 compliant?",
    answer:
      "Yes. Relace is built with enterprise security in mind, and our systems are SOC 2 compliant. This ensures your data is handled with the highest standards of confidentiality and integrity.",
  },
  {
    id: "self-host",
    question: "Can I self-host Relace models?",
    answer:
      "Absolutely. For teams with stricter compliance or latency requirements, we offer on-premise and VPC-isolated deployments. You get full control of your environment while still benefiting from Relace's optimized inference stack.",
  },
  {
    id: "sensitive-code",
    question: "How does Relace handle sensitive code?",
    answer:
      "Your code never leaves your controlled environment when using self-hosted or VPC deployments. Even on our hosted tier, all data is encrypted in transit and at rest.",
  },
  {
    id: "source-control-advantage",
    question: "What’s the main advantage for source control workflows?",
    answer:
      "Relace outperforms frontier LLMs at code retrieval and merging. Our models can search a codebase in under a second and merge at 10,000 tokens per second — speeding up PR reviews, automated fixes, and CI/CD processes.",
  },
  {
    id: "onboarding-speed",
    question: "How fast in onboarding?",
    answer:
      "You can start experimenting within minutes using our hosted API. For enterprise and self-hosted setups, our team provides guided onboarding to help you deploy Relace quickly and securely in your stack.",
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
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.15] tracking-[-0.04em] text-[#191918]">
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
                  className="w-full py-6 flex items-center justify-between gap-6 text-left group cursor-pointer focus:outline-none"
                >
                  <span className="text-lg sm:text-xl font-medium text-[#191918] font-parabole tracking-tight">
                    {item.question}
                  </span>

                  {/* Plus / Minus icon */}
                  <span className="relative w-4 h-4 flex items-center justify-center text-[#191918] shrink-0">
                    {/* Horizontal bar */}
                    <span className="absolute w-3 h-[1.5px] bg-[#191918]" />
                    {/* Vertical bar */}
                    <span
                      className={`absolute w-3 h-[1.5px] bg-[#191918] transition-transform duration-300 ${
                        isOpen ? "rotate-0 opacity-0" : "rotate-90 opacity-100"
                      }`}
                    />
                  </span>
                </button>

                {/* Animated Answer Body */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0 pb-0"
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
