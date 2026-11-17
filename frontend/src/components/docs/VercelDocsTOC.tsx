"use client";

import { useState, useEffect } from "react";
import { VERCEL_DOCS_NAV_GROUPS } from "@/data/docsData";

const TOC_ITEMS = VERCEL_DOCS_NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ id: item.id, label: item.label }))
);

interface VercelDocsTOCProps {
  activeSectionId: string;
  onSelectSection: (id: string) => void;
}

export function VercelDocsTOC({
  activeSectionId,
  onSelectSection,
}: VercelDocsTOCProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside className="hidden xl:block sticky top-16 h-[calc(100vh-4rem)] w-56 lg:w-64 shrink-0 p-6 overflow-y-auto z-20">
      <div className="flex flex-col gap-6">
        {/* TOC Header */}
        <div>
          <h2
            id="toc-heading"
            className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-3"
          >
            On this page
          </h2>

          {/* TOC Link list with active indicator */}
          <div className="relative">
            <ul className="space-y-2 text-xs">
              {TOC_ITEMS.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <li key={item.id} className="relative">
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1 bottom-1 w-0.5 bg-white rounded-full"
                      />
                    )}
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectSection(item.id);
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={`block truncate py-0.5 pl-3 transition-colors duration-150 ${
                        isActive
                          ? "text-white font-medium"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Community & Helpful Links */}
        <div className="flex flex-col gap-2.5 pt-2 text-xs text-neutral-400">
          <a
            href="https://github.com/faizjamadar18/waitfeed/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="8" r="6" />
              <line x1="8" y1="5" x2="8" y2="8" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
            <span>Report an issue</span>
          </a>

          <a
            href="https://github.com/faizjamadar18/waitfeed/blob/main/frontend/src/app/docs/page.tsx"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
              <path d="M6 10l2-2 2 2" />
            </svg>
            <span>Edit this page</span>
          </a>

          {showBackToTop && (
            <button
              type="button"
              onClick={scrollToTop}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-left pt-2 cursor-pointer text-xs text-neutral-400"
            >
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 12V4M4 8l4-4 4 4" />
              </svg>
              <span>Back to top</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
