"use client";

import { useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function InlineCode({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        "font-mono text-[0.85em] bg-[#f3f2e7] border border-[#e3e2d8] px-1.5 py-0.5 rounded-xs text-[#191918]",
        className
      )}
    >
      {children}
    </code>
  );
}

interface DocsSectionHeaderProps {
  id: string;
  overline: string;
  title: ReactNode;
  codeRef?: string;
  description?: ReactNode;
}

export function DocsSectionHeader({
  id,
  overline,
  title,
  codeRef,
  description,
}: DocsSectionHeaderProps) {
  const [copiedAnchor, setCopiedAnchor] = useState(false);

  const handleCopyAnchor = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    window.history.replaceState(null, "", `#${id}`);
    setCopiedAnchor(true);
    setTimeout(() => setCopiedAnchor(false), 1600);
  }, [id]);

  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-[#e3e2d8]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.25 bg-[#fcaa2d] shrink-0" />
          <span className="font-decima text-[10px] leading-none tracking-[0.04em] uppercase text-[#a36404]">
            {overline}
          </span>
        </div>
        {codeRef && (
          <span className="font-mono text-[11px] px-2 py-0.5 bg-[#f3f2e7] border border-[#e3e2d8] rounded-xs text-[#191918]/70">
            {codeRef}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-parabole font-normal leading-[1.12] tracking-[-0.035em] text-[#191918]">
          {title}
        </h2>
        <button
          type="button"
          onClick={handleCopyAnchor}
          title="Copy section link"
          aria-label={`Copy link to ${overline}`}
          className="shrink-0 font-decima text-[10px] uppercase tracking-wider px-2 py-1 rounded-xs border border-transparent hover:border-[#e3e2d8] hover:bg-[#f3f2e7] text-[#191918]/45 hover:text-[#191918] transition-colors cursor-pointer"
        >
          {copiedAnchor ? "copied" : `#${id}`}
        </button>
      </div>

      {description && (
        <p className="text-sm sm:text-[15px] font-parabole leading-relaxed text-[#191918]/65 max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}

interface DocsCodeBlockProps {
  code: string;
  title?: string;
  language?: string;
  className?: string;
}

export function DocsCodeBlock({
  code,
  title,
  language = "bash",
  className,
}: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [code]);

  return (
    <div
      className={cn(
        "rounded-xs border border-[#1E1E22] bg-[#0A0A0C] text-[#EDEDF0] overflow-hidden shadow-xs",
        className
      )}
    >
      {/* Terminal / Code Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1E1E22] bg-[#0d0d0f]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[#8A9397]/50" />
            <span className="h-2 w-2 rounded-full bg-[#8A9397]/50" />
            <span className="h-2 w-2 rounded-full bg-[#8A9397]/50" />
          </div>
          <span className="font-mono text-[11px] text-[#8A8A94] truncate ml-1">
            {title ?? language}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {title && (
            <span className="hidden sm:inline font-decima text-[9px] uppercase tracking-widest text-[#5C5C66]">
              {language}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied code" : "Copy code"}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs border border-[#1E1E22] bg-[#141418] hover:border-[#fcaa2d]/50 text-[#8A8A94] hover:text-[#EDEDF0] font-decima text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <span className="text-[#27AD75]">✓</span>
                <span className="text-[#27AD75]">Copied</span>
              </>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre className="p-4 overflow-x-auto font-mono text-[12px] leading-relaxed text-[#EDEDF0]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface DocsCalloutProps {
  title: string;
  tone?: "amber" | "green" | "ink";
  children: ReactNode;
}

export function DocsCallout({ title, tone = "amber", children }: DocsCalloutProps) {
  const borderClass =
    tone === "green"
      ? "border-l-[#27AD75]"
      : tone === "ink"
        ? "border-l-[#191918]"
        : "border-l-[#fcaa2d]";

  const titleClass =
    tone === "green"
      ? "text-[#1b7a52]"
      : tone === "ink"
        ? "text-[#191918]"
        : "text-[#a36404]";

  return (
    <div
      className={cn(
        "rounded-xs border border-[#e3e2d8] border-l-2 bg-[#f3f2e7]/80 px-4 py-3.5 flex flex-col gap-1.5",
        borderClass
      )}
    >
      <span className={cn("font-decima text-[10px] uppercase tracking-[0.05em]", titleClass)}>
        {title}
      </span>
      <div className="text-[13.5px] sm:text-sm font-parabole leading-relaxed text-[#191918]/75">
        {children}
      </div>
    </div>
  );
}

interface DocsTableProps {
  headers: string[];
  rows: ReactNode[][];
}

export function DocsTable({ headers, rows }: DocsTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xs border border-[#e3e2d8] bg-[#fffef2]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f3f2e7] border-b border-[#e3e2d8]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3.5 py-2.5 font-decima text-[10px] font-normal uppercase tracking-[0.06em] text-[#191918]/70 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e3e2d8] text-[13px] font-parabole">
          {rows.map((cells, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-[#f3f2e7]/45 transition-colors align-top">
              {cells.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3.5 py-3 text-[#191918]/80 leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

