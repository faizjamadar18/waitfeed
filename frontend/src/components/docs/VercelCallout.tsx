"use client";

import { type ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "important";

interface VercelCalloutProps {
  type?: CalloutType;
  title?: string;
  children?: ReactNode;
}

export function VercelCallout({
  type = "note",
  title,
  children,
}: VercelCalloutProps) {
  const defaultTitle =
    type === "note"
      ? "Good to know"
      : type === "tip"
        ? "Tip"
        : type === "warning"
          ? "Warning"
          : "Important";

  return (
    <div className="my-5 flex items-start gap-3 rounded-lg border border-white/10 bg-[#181818] p-4 sm:p-5 text-sm leading-relaxed text-[#ededed]">
      <div className="shrink-0 mt-0.5 text-[#8e8e8e]">
        {type === "note" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-[#8e8e8e]"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M6.25 7h1.5a1 1 0 0 1 1 1v4.25h-1.5V8.5h-1zM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
            />
          </svg>
        )}
        {type === "tip" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-[#8e8e8e]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 1.5a4.5 4.5 0 0 0-2.5 8.2V11a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9.7A4.5 4.5 0 0 0 8 1.5z" />
            <line x1="6.5" y1="14" x2="9.5" y2="14" />
          </svg>
        )}
        {type === "warning" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-[#8e8e8e]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m8 2 6 11H2L8 2z" />
            <line x1="8" y1="6" x2="8" y2="9" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
        )}
        {type === "important" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-[#8e8e8e]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 1.5 2 4.5v5c0 3.5 3 5.5 6 6 3-.5 6-2.5 6-6v-5L8 1.5z" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-medium text-[#ededed] text-sm leading-normal mb-1.5">
          {title ?? defaultTitle}
        </div>
        <div className="text-sm text-[#ededed] leading-relaxed [&_code]:rounded [&_code]:border [&_code]:border-white/15 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#ededed] [&_a]:text-[#ededed] [&_a]:underline [&_a]:decoration-1 [&_a]:decoration-[#878787] [&_a]:underline-offset-4 hover:[&_a]:decoration-white hover:[&_a]:text-white [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2 [&_ul]:my-1.5 [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:top-[0.6em] [&_li]:before:left-0 [&_li]:before:size-1 [&_li]:before:rounded-full [&_li]:before:bg-[#878787] [&_li]:before:content-['']">
          {children}
        </div>
      </div>
    </div>
  );
}
