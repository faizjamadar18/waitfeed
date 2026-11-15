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
    <div className="relative my-4 rounded-lg border border-neutral-800 bg-[#0a0a0a] overflow-hidden group">
      {/* Header bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center gap-2">
          {/* Terminal Dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700/60" />
          </div>
          {filename && (
            <span className="text-xs font-mono text-neutral-300 pl-2">
              {filename}
            </span>
          )}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-md text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-700 border border-neutral-700/60 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8.5 6.5 12 13 4" />
              </svg>
              <span className="text-emerald-400 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
                <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
              </svg>
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

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
                      <span className="text-amber-400 font-bold select-none mr-2">
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
    <div className="relative my-4 rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden group">
      {/* Tab bar header */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/60">
        <div className="flex items-center gap-1">
          {(["npx", "pnpm", "bun", "yarn"] as PackageManager[]).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setActivePm(pm)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                activePm === pm
                  ? "bg-neutral-800 text-white font-medium border border-neutral-700/60"
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
          className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-700 border border-neutral-700/60 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8.5 6.5 12 13 4" />
              </svg>
              <span className="text-emerald-400 text-[11px] font-medium">Copied</span>
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
                <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
              </svg>
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 sm:p-5 flex items-center font-mono text-sm sm:text-base text-white">
        <span className="text-amber-400/80 mr-3 select-none font-bold">$</span>
        <span className="text-amber-300 font-medium">{currentCode}</span>
      </div>
    </div>
  );
}
