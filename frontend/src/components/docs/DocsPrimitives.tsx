"use client";

import { useState, useCallback, type ReactNode } from "react";
import { ASCII_BANNER_ROWS, type EditorKey } from "@/data/docsData";
import {
  AntigravityIcon,
  ClaudeIcon,
  OpenCodeIcon,
} from "@/components/Icons";
import { cn } from "@/lib/utils";

export function EditorIcon({
  editor,
  className = "w-3.5 h-3.5",
}: {
  editor: EditorKey;
  className?: string;
}) {
  if (editor === "opencode") return <OpenCodeIcon className={className} />;
  if (editor === "claude") return <ClaudeIcon className={className} />;
  return <AntigravityIcon className={className} />;
}

function CopyClipboardIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
      <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
    </svg>
  );
}

function CheckTickIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3 8.5 6.5 12 13 4" />
    </svg>
  );
}

function AnchorLinkIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.5 9.5a3.2 3.2 0 0 0 4.5.2l2-2a3.2 3.2 0 0 0-4.5-4.5L7.4 4.3" />
      <path d="M9.5 6.5a3.2 3.2 0 0 0-4.5-.2l-2 2a3.2 3.2 0 0 0 4.5 4.5l1.1-1.1" />
    </svg>
  );
}

function MacTrafficLights() {
  return (
    <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] ring-1 ring-inset ring-black/20" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] ring-1 ring-inset ring-black/20" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F] ring-1 ring-inset ring-black/20" />
    </div>
  );
}

function CopySnippetButton({
  copied,
  onClick,
  ariaLabel,
}: {
  copied: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "group shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-decima text-[10px] uppercase tracking-wider transition-all cursor-pointer",
        copied
          ? "border-[#27AD75]/50 bg-[#27AD75]/10 text-[#27AD75]"
          : "border-[#262630] bg-[#16161C] hover:bg-[#1C1C24] hover:border-[#fcaa2d]/50 text-[#A1A1AA] hover:text-[#EDEDF0]"
      )}
    >
      {copied ? (
        <>
          <CheckTickIcon className="w-3 h-3 text-[#27AD75]" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <CopyClipboardIcon className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-105" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

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
 * Light, Vercel-style inline copyable command pill for capability bars and
 * reference tables where a heavy macOS terminal window would add clutter.
 */
export function CopyableCommandChip({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
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
  }, [command]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${command}` : `Copy command ${command}`}
      title={copied ? "Copied!" : `Copy ${command}`}
      className={cn(
        "group inline-flex items-center gap-2 px-2.5 py-1 rounded-xs border border-[#e3e2d8] bg-[#fffef2] hover:border-[#fcaa2d] text-left transition-colors cursor-pointer shrink-0",
        copied && "border-[#27AD75]/60 bg-[#27AD75]/5",
        className
      )}
    >
      <span className="font-mono text-[11px] text-[#a36404] select-none">$</span>
      <code className="font-mono text-[12px] text-[#191918] whitespace-nowrap">
        {command}
      </code>
      <span
        className={cn(
          "inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 transition-colors",
          copied
            ? "text-[#166e49]"
            : "text-[#191918]/40 group-hover:text-[#191918]"
        )}
      >
        {copied ? (
          <CheckTickIcon className="w-3 h-3" />
        ) : (
          <CopyClipboardIcon className="w-3 h-3" />
        )}
      </span>
    </button>
  );
}

/**
 * Renders the authentic 3D ASCII startup banner from `packages/waitfeed/bin.mjs`
 * with exact 24-bit gradient stops (`#ffd9a0` -> `#ff8a1f` -> `#c4500a`) and
 * 40% brightness shadow edges (`╗`, `║`, `╔`, `═`, `╚`, `╝`).
 */
export function AsciiWaitFeedBanner({
  version = "1.3.0",
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
        "rounded-xl border border-[#23232C] bg-[#0A0A0D] text-[#EDEDF0] overflow-hidden shadow-[0_18px_40px_-18px_rgba(25,25,24,0.34),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* macOS Titlebar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1D1D25] bg-[#16161B]">
        <div className="flex items-center gap-3 min-w-0">
          <MacTrafficLights />

          {tabs && tabs.length > 0 ? (
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0A0A0D] border border-[#1E1E26] overflow-x-auto">
              {tabs.map((tab, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-decima text-[10px] uppercase tracking-wider transition-all cursor-pointer shrink-0",
                      isActive
                        ? "bg-[#1C1C23] text-[#fcaa2d] border border-[#2E2E38] shadow-xs"
                        : "text-[#8A8A94] hover:text-[#EDEDF0] border border-transparent"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="font-sans text-[12px] font-medium text-[#C8C8D2] truncate">
              {title}
            </span>
          )}
        </div>

        <CopySnippetButton
          copied={copied}
          onClick={handleCopy}
          ariaLabel={copied ? "Copied command" : "Copy command"}
        />
      </div>

      {/* Command Body */}
      <div className="px-4 py-3.5 overflow-x-auto flex flex-col gap-1.5 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(252,170,45,0.03),transparent)]">
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
  icon?: ReactNode;
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
  icon,
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
        "rounded-xl border border-[#23232C] bg-[#0A0A0D] text-[#EDEDF0] overflow-hidden shadow-[0_18px_40px_-18px_rgba(25,25,24,0.34),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* macOS Titlebar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1D1D25] bg-[#16161B]">
        <div className="flex items-center gap-3 min-w-0">
          <MacTrafficLights />
          <div className="flex items-center gap-1.5 min-w-0">
            {icon}
            <span className="font-sans text-[12px] font-medium text-[#C8C8D2] truncate">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="font-decima text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#18181F] border border-[#282834] text-[#fcaa2d]">
              {badge}
            </span>
          )}
          {copyText && (
            <CopySnippetButton
              copied={copied}
              onClick={handleCopy}
              ariaLabel={copied ? "Copied snippet" : "Copy snippet"}
            />
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 overflow-x-auto bg-[radial-gradient(120%_70%_at_50%_0%,rgba(252,170,45,0.03),transparent)]">
        {children}
      </div>

      {footer && (
        <div className="border-t border-[#1D1D25] bg-[#0E0E13] px-4 py-2.5">
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
          className="shrink-0 inline-flex items-center gap-1.5 font-decima text-[10px] uppercase tracking-wider px-2 py-1 rounded-xs border border-transparent hover:border-[#e3e2d8] hover:bg-[#f3f2e7] text-[#191918]/45 hover:text-[#191918] transition-colors cursor-pointer"
        >
          {copiedAnchor ? (
            <>
              <CheckTickIcon className="w-3 h-3 text-[#27AD75]" />
              <span className="text-[#27AD75]">copied</span>
            </>
          ) : (
            <>
              <AnchorLinkIcon className="w-3 h-3" />
              <span>#{id}</span>
            </>
          )}
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
