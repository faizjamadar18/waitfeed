"use client";

import { useState } from "react";

interface VercelCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function VercelCodeBlock({
  code,
  language = "bash",
  filename,
  showLineNumbers = false,
}: VercelCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split("\n");

  return (
    <div className="relative my-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60 overflow-hidden group">
      {/* Header bar when filename is present */}
      {filename ? (
        <div className="h-9 px-4 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/40">
          <span className="text-xs font-mono text-neutral-400 select-none">
            {filename}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied code" : "Copy code"}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 px-1.5 -mr-1.5"
          >
            {copied ? (
              <>
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5 text-neutral-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 8.5 6.5 12 13 4" />
                </svg>
                <span className="text-[11px] text-neutral-300">Copied</span>
              </>
            ) : (
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
                <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
              </svg>
            )}
          </button>
        </div>
      ) : (
        /* Floating copy button when no filename */
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-neutral-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8.5 6.5 12 13 4" />
              </svg>
              <span className="text-[11px] text-neutral-300">Copied</span>
            </>
          ) : (
            <svg
              viewBox="0 0 16 16"
              className="w-3.5 h-3.5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
              <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
            </svg>
          )}
        </button>
      )}

      {/* Code body */}
      <div className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-neutral-200">
        <pre className="m-0">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                {showLineNumbers && (
                  <span className="table-cell select-none pr-4 text-right text-neutral-600 w-8">
                    {idx + 1}
                  </span>
                )}
                <span className="table-cell">
                  {language === "bash" && line.startsWith("$ ") ? (
                    <>
                      <span className="text-neutral-500 font-normal select-none mr-2">
                        $
                      </span>
                      <span>{line.slice(2)}</span>
                    </>
                  ) : (
                    line
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

type PackageManager = "npx" | "pnpm" | "bun" | "yarn";

interface VercelCliTabsProps {
  command: string;
}

export function VercelCliTabs({ command }: VercelCliTabsProps) {
  const [activePm, setActivePm] = useState<PackageManager>("npx");
  const [copied, setCopied] = useState(false);

  const getFullCommand = (pm: PackageManager) => {
    switch (pm) {
      case "npx":
        return `npx ${command}`;
      case "pnpm":
        return `pnpm dlx ${command}`;
      case "bun":
        return `bunx ${command}`;
      case "yarn":
        return `yarn dlx ${command}`;
    }
  };

  const currentCode = getFullCommand(activePm);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative my-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60 overflow-hidden group">
      {/* Tab bar header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center gap-1">
          {(["npx", "pnpm", "bun", "yarn"] as PackageManager[]).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setActivePm(pm)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                activePm === pm
                  ? "bg-neutral-800 text-white font-medium shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied command" : "Copy command"}
          className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 px-1.5 -mr-1"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-neutral-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8.5 6.5 12 13 4" />
              </svg>
              <span className="text-[11px] text-neutral-300">Copied</span>
            </>
          ) : (
            <svg
              viewBox="0 0 16 16"
              className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
              <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 sm:p-5 flex items-center font-mono text-sm sm:text-base text-white">
        <span className="text-neutral-500 mr-3 select-none font-normal">$</span>
        <span className="text-neutral-200 font-medium">{currentCode}</span>
      </div>
    </div>
  );
}
