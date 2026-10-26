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
    id: "source-control",
    question: "What’s the main advantage for source control workflows?",
    answer:
      "Relace outperforms frontier LLMs at code retrieval and merging. Our models can search a codebase in under a second and merge at 10,000 tokens per second — speeding up PR reviews, automated fixes, and CI/CD processes.",
  },
  {
    id: "onboarding",
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
    <section id="faq" className="w-full pt-28 pb-0 px-5 sm:px-10 flex flex-col items-center justify-center border-t border-[#e3e2d8]">
      <div className="w-full max-w-266 flex flex-col md:flex-row items-start justify-start gap-10 md:gap-0">
        {/* Left Column: Header (matches Relace #faq-header: flex: 1 0 0, 0 20px padding) */}
        <div className="w-full md:w-2/5 flex flex-col items-start gap-5 px-5 shrink-0">
          {/* Overline */}
          <div className="flex flex-row items-center gap-2.5">
            <span className="w-1.5 h-1.25 bg-[#fcaa2d] shrink-0" />
            <span className="font-decima text-[10px] leading-[1.1] tracking-[0.03em] uppercase text-[#fcaa2d]">
              FAQs
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-[32px] sm:text-[36px] md:text-[40px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-black">
            Frequently<br className="hidden md:inline" /> asked<br className="hidden md:inline" /> questions
          </h2>
        </div>

        {/* Right Column: FAQ Accordion List (matches Relace #faq-list: flex: 3 0 0) */}
        <div className="w-full md:w-3/5 flex flex-col px-5 md:px-0">
          <ul className="w-full flex flex-col border-b border-[#191918]/10 list-none p-0 m-0">
            {FAQS.map((item) => {
              const isOpen = Boolean(openIds[item.id]);
              return (
                <li key={item.id} className="border-t border-[#191918]/10 w-full">
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    className="w-full py-6 flex items-center justify-between gap-3 text-left cursor-pointer group focus:outline-none"
                  >
                    <span className="font-parabole text-lg sm:text-xl font-medium leading-[1.06] tracking-[-0.03em] text-black">
                      {item.question}
                    </span>

                    {/* Plus / Minus indicator */}
                    <span className="relative w-6 h-6 flex items-center justify-center text-[#191918] shrink-0">
                      <span className="absolute w-3.5 h-[1.5px] bg-[#191918]" />
                      <span
                        className={`absolute w-3.5 h-[1.5px] bg-[#191918] transition-transform duration-300 ${
                          isOpen ? "rotate-90 scale-0" : "rotate-90 scale-100"
                        }`}
                      />
                    </span>
                  </button>

                  {/* Expandable answer */}
                  {isOpen && (
                    <div className="pb-6 pr-5 text-base font-parabole leading-normal text-[#191918]/60 animate-fade-in">
                      {item.answer}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
