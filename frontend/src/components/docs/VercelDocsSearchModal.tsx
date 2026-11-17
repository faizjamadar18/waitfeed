"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  VERCEL_DOCS_NAV_GROUPS,
  AGENT_GUIDES,
  BUILTIN_CHANNELS,
  CLI_COMMANDS,
  CONFIG_OPTIONS,
  LOCAL_FILES_EXPLAINED,
  BEGINNER_FAQS,
} from "@/data/docsData";

interface SearchEntry {
  id: string;
  sectionId: string;
  category: string;
  title: string;
  description: string;
  keywords: string;
}

interface VercelDocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionId: string) => void;
}

export function VercelDocsSearchModal({
  isOpen,
  onClose,
  onSelectSection,
}: VercelDocsSearchModalProps) {
  const [query, setQuery] = useState("");
  const [rawSelectedIndex, setRawSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build searchable index
  const allEntries: SearchEntry[] = useMemo(() => {
    const list: SearchEntry[] = [];

    // Nav items
    VERCEL_DOCS_NAV_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        list.push({
          id: `nav-${item.id}`,
          sectionId: item.id,
          category: group.title,
          title: item.label,
          description: item.summary,
          keywords: `${item.label} ${item.summary} ${item.group} ${item.id}`,
        });
      });
    });

    // Agent guides
    AGENT_GUIDES.forEach((guide) => {
      list.push({
        id: `agent-${guide.key}`,
        sectionId: guide.id,
        category: "Agent",
        title: guide.name,
        description: guide.summary,
        keywords: `${guide.name} ${guide.where} ${guide.readMore} ${guide.toggle} ${guide.requires} opencode claude antigravity`,
      });
    });

    // Channels
    BUILTIN_CHANNELS.forEach((ch) => {
      list.push({
        id: `channel-${ch.badge}`,
        sectionId: "feeds-builtin",
        category: "Channel",
        title: `${ch.name} [${ch.badge}]`,
        description: ch.description,
        keywords: `${ch.name} ${ch.badge} ${ch.description} rss atom feed`,
      });
    });

    // Config keys
    CONFIG_OPTIONS.forEach((option) => {
      list.push({
        id: `config-${option.key}`,
        sectionId: "config-schema",
        category: "Config",
        title: option.key,
        description: option.description,
        keywords: `${option.key} ${option.type} ${option.defaultValue} ${option.description} config json`,
      });
    });

    // CLI Commands
    CLI_COMMANDS.forEach((cmd) => {
      list.push({
        id: `cli-${cmd.command.replace(/\s+/g, "-")}`,
        sectionId: "cli-init",
        category: "CLI",
        title: cmd.command,
        description: cmd.summary,
        keywords: `${cmd.command} ${cmd.summary} ${cmd.note ?? ""} terminal shell`,
      });
    });

    // Local files
    LOCAL_FILES_EXPLAINED.forEach((file) => {
      list.push({
        id: `file-${file.path}`,
        sectionId: "config-storage",
        category: "Local file",
        title: `${file.path} — ${file.role}`,
        description: file.detail,
        keywords: `${file.path} ${file.role} ${file.detail} ${file.retention} cache json lock`,
      });
    });

    // FAQs
    BEGINNER_FAQS.forEach((faq, idx) => {
      list.push({
        id: `faq-${idx}`,
        sectionId: "faq",
        category: "FAQ",
        title: faq.q,
        description: faq.a,
        keywords: `${faq.q} ${faq.a} question answer troubleshoot`,
      });
    });

    return list;
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return allEntries.slice(0, 8);
    const q = query.toLowerCase();
    return allEntries
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [allEntries, query]);

  const selectedIndex = results.length > 0 ? Math.min(rawSelectedIndex, results.length - 1) : 0;

  const handleClose = () => {
    setQuery("");
    setRawSelectedIndex(0);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setRawSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setRawSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = results[selectedIndex];
      if (current) {
        onSelectSection(current.sectionId);
        handleClose();
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-neutral-800 flex items-center gap-3">
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4 text-neutral-400 shrink-0 ml-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="m11 11 3.5 3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setRawSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search docs, config keys, and CLI commands..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-hidden"
          />
          <kbd
            onClick={handleClose}
            className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-400 cursor-pointer hover:text-white"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No documentation matches found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.sectionId);
                    handleClose();
                  }}
                  onMouseEnter={() => setRawSelectedIndex(idx)}
                  className={`p-3 rounded-lg flex flex-col gap-1 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-neutral-800/80 text-white"
                      : "text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium tracking-tight truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-sm border border-neutral-800 bg-neutral-900/80 text-neutral-400 shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1 leading-normal">
                    {item.description}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 border-t border-neutral-800/80 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>WaitFeed Docs</span>
        </div>
      </div>
    </div>
  );
}
