"use client";

import { useState, useCallback, type ReactNode } from "react";
import { ASCII_BANNER_ROWS } from "@/data/docsData";
import { cn } from "@/lib/utils";

export function InlineCode({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "font-mono text-[0.86em] bg-[#f3f2e7] border border-[#e3e2d8] px-1.5 py-0.5 rounded-xs text-[#191918]",
        className
      )}
    >
      {children}
    </code>
  );
}

/**
 * Renders the authentic 3D ASCII startup banner from `packages/waitfeed/bin.mjs`
 * with exact 24-bit gradient stops (`#ffd9a0` -> `#ff8a1f` -> `#c4500a`) and
 * 40% brightness shadow edges (`╗`, `║`, `╔`, `═`, `╚`, `╝`).
 */
export function AsciiWaitFeedBanner({
  version = "1.2.0",
  compact = false,
}: {
  version?: string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto select-none">
      <div
        className={cn(
          "font-mono whitespace-pre tracking-normal leading-[1.16]",
          compact
            ? "text-[7px] sm:text-[9px]"
            : "text-[7.5px] sm:text-[10.5px] md:text-[11.5px]"
        )}
        aria-label="WAITFEED ASCII terminal banner"
      >
        {ASCII_BANNER_ROWS.map((row, rowIdx) => (
          <div key={rowIdx}>
            {Array.from(row.text).map((ch, charIdx) => {
              if (ch === " ") return <span key={charIdx}> </span>;
              return (
                <span
                  key={charIdx}
                  style={{
                    color: ch === "█" ? row.frontHex : row.shadowHex,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}
        <div className="mt-1.5 text-[10px] sm:text-[11.5px] text-[#8B8981] font-mono">
          News on your screen while your AI agent works · v{version}
        </div>
      </div>
    </div>
  );
}

function copyTextFallback(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => execCopyFallback(text));
  }
  return Promise.resolve(execCopyFallback(text));
}

function execCopyFallback(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export interface CommandTab {
  label: string;
  command: string;
  hint?: string;
}

interface TerminalCommandProps {
  command?: string;
  tabs?: CommandTab[];
  title?: string;
  promptSymbol?: string;
  className?: string;
}

/**
 * Vercel `<Snippet>`-inspired dark terminal command bar with optional tab switcher
 * and clean clipboard copy (strips the `$ ` prompt automatically).
 */
export function TerminalCommand({
  command,
  tabs,
  title = "Terminal",
  promptSymbol = "$",
  className,
}: TerminalCommandProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentTab = tabs && tabs.length > 0 ? tabs[activeIdx] ?? tabs[0] : null;
  const activeCommand = currentTab ? currentTab.command : (command ?? "");
  const activeHint = currentTab?.hint;

  const handleCopy = useCallback(async () => {
    if (!activeCommand) return;
    const ok = await copyTextFallback(activeCommand);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [activeCommand]);

  return (
    <div
      className={cn(
        "rounded-sm border border-[#1E1E22] bg-[#0A0A0C] text-[#EDEDF0] overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Top Window Bar */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 border-b border-[#1E1E22] bg-[#111114]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]/85" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/85" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]/85" />
          </div>

          {tabs && tabs.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={cn(
                      "px-2.5 py-1 rounded-xs font-decima text-[10px] uppercase tracking-wider transition-colors cursor-pointer shrink-0",
                      isActive
                        ? "bg-[#1C1C21] text-[#fcaa2d] border border-[#2D2D35]"
                        : "text-[#8A8A94] hover:text-[#EDEDF0] border border-transparent"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="font-mono text-[11px] text-[#8A8A94] truncate">
              {title}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied command" : "Copy command"}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border border-[#23232A] bg-[#16161B] hover:border-[#fcaa2d]/60 text-[#A1A1AA] hover:text-[#EDEDF0] font-decima text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
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

      {/* Command Body */}
      <div className="px-4 py-3.5 overflow-x-auto flex flex-col gap-1.5">
        <div className="font-mono text-[13px] leading-relaxed flex items-baseline gap-2.5 whitespace-pre">
          <span className="select-none text-[#fcaa2d] font-bold">
            {promptSymbol}
          </span>
          <code className="text-[#EDEDF0]">{activeCommand}</code>
        </div>
        {activeHint && (
          <div className="font-mono text-[11.5px] text-[#7D8590] pl-5 whitespace-pre">
            {activeHint}
          </div>
        )}
      </div>
    </div>
  );
}

interface TerminalWindowProps {
  title: string;
  badge?: string;
  copyText?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Rich dark terminal emulator frame for interactive output, setup previews,
 * JSON configs, and live WaitFeed card mockups.
 */
export function TerminalWindow({
  title,
  badge,
  copyText,
  children,
  footer,
  className,
}: TerminalWindowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    const ok = await copyTextFallback(copyText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [copyText]);

  return (
    <div
      className={cn(
        "rounded-sm border border-[#1E1E22] bg-[#0A0A0C] text-[#EDEDF0] overflow-hidden shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-[#1E1E22] bg-[#111114]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]/85" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/85" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]/85" />
          </div>
          <span className="font-mono text-[11px] text-[#8A8A94] truncate ml-1">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="font-decima text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#18181D] border border-[#26262E] text-[#fcaa2d]">
              {badge}
            </span>
          )}
          {copyText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied snippet" : "Copy snippet"}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs border border-[#23232A] bg-[#16161B] hover:border-[#fcaa2d]/60 text-[#A1A1AA] hover:text-[#EDEDF0] font-decima text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
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
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 overflow-x-auto">{children}</div>

      {footer && (
        <div className="border-t border-[#1E1E22] bg-[#0E0E12] px-4 py-2.5">
          {footer}
        </div>
      )}
    </div>
  );
}

interface DocsSectionHeaderProps {
  id: string;
  step?: string;
  title: ReactNode;
  subtitle?: ReactNode;
}

export function DocsSectionHeader({
  id,
  step,
  title,
  subtitle,
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
    <div className="flex flex-col gap-2.5 pb-4 border-b border-[#e3e2d8]">
      {step && (
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#fcaa2d] shrink-0" />
          <span className="font-decima text-[10px] leading-none tracking-[0.06em] uppercase text-[#a36404]">
            {step}
          </span>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl sm:text-[28px] font-parabole font-medium leading-[1.15] tracking-[-0.03em] text-[#191918]">
          {title}
        </h2>
        <button
          type="button"
          onClick={handleCopyAnchor}
          title="Copy section link"
          aria-label={`Copy link to ${id}`}
          className="shrink-0 font-decima text-[10px] uppercase tracking-wider px-2 py-1 rounded-xs border border-transparent hover:border-[#e3e2d8] hover:bg-[#f3f2e7] text-[#191918]/40 hover:text-[#191918] transition-colors cursor-pointer"
        >
          {copiedAnchor ? "copied" : `#${id}`}
        </button>
      </div>

      {subtitle && (
        <p className="text-[15px] font-parabole leading-relaxed text-[#191918]/65 max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface DocsCalloutProps {
  title: string;
  tone?: "amber" | "green" | "ink";
  children: ReactNode;
}

export function DocsCallout({
  title,
  tone = "amber",
  children,
}: DocsCalloutProps) {
  const borderClass =
    tone === "green"
      ? "border-l-[#27AD75]"
      : tone === "ink"
        ? "border-l-[#191918]"
        : "border-l-[#fcaa2d]";

  const titleClass =
    tone === "green"
      ? "text-[#166e49]"
      : tone === "ink"
        ? "text-[#191918]"
        : "text-[#a36404]";

  return (
    <div
      className={cn(
        "rounded-xs border border-[#e3e2d8] border-l-3 bg-[#f3f2e7]/80 px-4 py-3.5 flex flex-col gap-1",
        borderClass
      )}
    >
      <span
        className={cn(
          "font-decima text-[10px] uppercase tracking-[0.06em]",
          titleClass
        )}
      >
        {title}
      </span>
      <div className="text-[14px] font-parabole leading-relaxed text-[#191918]/80">
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
                className="px-4 py-2.5 font-decima text-[10px] font-normal uppercase tracking-[0.06em] text-[#191918]/65 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e3e2d8] text-[13.5px] font-parabole">
          {rows.map((cells, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-[#f3f2e7]/50 transition-colors align-top"
            >
              {cells.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-[#191918]/80 leading-relaxed"
                >
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

/**
 * Vercel-style numbered step container so guides read clearly one step at a time.
 */
export function StepList({
  steps,
}: {
  steps: Array<{ title: string; description: ReactNode; content?: ReactNode }>;
}) {
  return (
    <div className="flex flex-col">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#191918] text-[#fffef2] font-decima text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              {!isLast && <div className="w-px flex-1 bg-[#e3e2d8] my-2" />}
            </div>

            <div className={cn("flex-1 min-w-0 flex flex-col gap-3", !isLast && "pb-8")}>
              <div className="flex flex-col gap-1 pt-0.5">
                <h3 className="text-[17px] font-parabole font-medium text-[#191918]">
                  {step.title}
                </h3>
                <div className="text-[14px] font-parabole leading-relaxed text-[#191918]/70">
                  {step.description}
                </div>
              </div>
              {step.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
