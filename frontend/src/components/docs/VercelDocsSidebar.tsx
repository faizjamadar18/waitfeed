"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  VERCEL_DOCS_NAV_GROUPS,
  WAITFEED_VERSION,
  type DocsNavItem,
} from "@/data/docsData";

interface VercelDocsSidebarProps {
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function VercelDocsSidebar({
  activeSectionId,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}: VercelDocsSidebarProps) {
  const handleItemClick = (item: DocsNavItem) => {
    onSelectSection(item.id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Nav tree */}
      <nav
        aria-label="Docs navigation"
        className="docs-sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs select-none"
      >
        {VERCEL_DOCS_NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">
              {group.title}
            </h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleItemClick(item);
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors duration-150 ${
                        isActive
                          ? "bg-white/[0.08] text-white font-medium shadow-xs"
                          : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r-xs"
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom link info */}
      <div className="p-3 bg-transparent text-[11px] text-neutral-500 flex items-center justify-between">
        <span className="font-mono">waitfeed v{WAITFEED_VERSION}</span>
        <span className="text-[10px] text-neutral-500">MIT License</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] w-64 lg:w-72 shrink-0 bg-black overflow-hidden z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
              onClick={onCloseMobile}
            />
            {/* Drawer Canvas */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-72 max-w-[85vw] h-full bg-neutral-950 border-r border-neutral-800 shadow-2xl flex flex-col z-10"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-800">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                  Documentation Menu
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l10 10M13 3 3 13" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{sidebarContent}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
