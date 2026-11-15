"use client";

interface TocItem {
  id: string;
  label: string;
}

const TOC_ITEMS: TocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quickstart" },
  { id: "agent-opencode", label: "OpenCode Setup" },
  { id: "agent-claude", label: "Claude Code Setup" },
  { id: "agent-agy", label: "Antigravity (AGY)" },
  { id: "architecture", label: "Zero-Token Architecture" },
  { id: "feeds-builtin", label: "Built-in Channels" },
  { id: "feeds-custom", label: "Custom RSS Feeds" },
  { id: "config-schema", label: "config.json Schema" },
  { id: "config-storage", label: "Local Storage & Locks" },
  { id: "cli-init", label: "CLI Reference" },
  { id: "smart-visibility", label: "Smart Visibility Guarantee" },
  { id: "faq", label: "Troubleshooting & FAQ" },
];

interface VercelDocsTOCProps {
  activeSectionId: string;
  onSelectSection: (id: string) => void;
}

export function VercelDocsTOC({
  activeSectionId,
  onSelectSection,
}: VercelDocsTOCProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside className="hidden xl:block sticky top-16 h-[calc(100vh-4rem)] w-56 lg:w-64 shrink-0 border-l border-neutral-800/80 p-6 overflow-y-auto z-20">
      <div className="flex flex-col gap-6">
        {/* TOC Header */}
        <div>
          <h2
            id="toc-heading"
            className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-3"
          >
            On this page
          </h2>

          {/* TOC Link list with active indicator track */}
          <div className="relative pl-3 border-l border-neutral-800">
            <ul className="space-y-2 text-xs">
              {TOC_ITEMS.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <li key={item.id} className="relative">
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute -left-[13px] top-1 bottom-1 w-0.5 bg-amber-400 rounded-full"
                      />
                    )}
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectSection(item.id);
                      }}
                      className={`block py-0.5 transition-colors duration-150 truncate ${
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

        {/* Separator */}
        <div className="h-px w-full bg-neutral-800/80" />

        {/* Community & Helpful Links */}
        <div className="flex flex-col gap-2.5 text-xs text-neutral-400">
          <a
            href="https://github.com/faizjamadar/waitfeed/issues/new"
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
            href="https://github.com/faizjamadar/waitfeed"
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
            <span>Edit on GitHub</span>
          </a>

          <button
            type="button"
            onClick={scrollToTop}
            className="hover:text-white transition-colors flex items-center gap-1.5 text-left pt-2 cursor-pointer"
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
        </div>
      </div>
    </aside>
  );
}
