"use client";

import { type ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "important";

interface VercelCalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

export function VercelCallout({
  type = "note",
  title,
  children,
}: VercelCalloutProps) {
  const styles = {
    note: {
      border: "border-amber-900/60",
      bg: "bg-amber-950/20",
      iconColor: "text-amber-400",
      titleColor: "text-amber-300",
      defaultTitle: "Note",
    },
    tip: {
      border: "border-amber-900/60",
      bg: "bg-amber-950/20",
      iconColor: "text-amber-400",
      titleColor: "text-amber-300",
      defaultTitle: "Tip",
    },
    warning: {
      border: "border-amber-900/60",
      bg: "bg-amber-950/20",
      iconColor: "text-amber-400",
      titleColor: "text-amber-300",
      defaultTitle: "Warning",
    },
    important: {
      border: "border-amber-900/60",
      bg: "bg-amber-950/20",
      iconColor: "text-amber-400",
      titleColor: "text-amber-300",
      defaultTitle: "Important",
    },
  }[type];

  return (
    <div
      className={`my-4 p-4 rounded-lg border ${styles.border} ${styles.bg} flex items-start gap-3 text-xs sm:text-sm text-neutral-200 leading-relaxed`}
    >
      <div className={`shrink-0 mt-0.5 ${styles.iconColor}`}>
        {type === "note" && (
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="7" x2="8" y2="11" />
            <circle cx="8" cy="5" r="0.5" fill="currentColor" />
          </svg>
        )}
        {type === "tip" && (
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 1.5a4.5 4.5 0 0 0-2.5 8.2V11a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9.7A4.5 4.5 0 0 0 8 1.5z" />
            <line x1="6.5" y1="14" x2="9.5" y2="14" />
          </svg>
        )}
        {type === "warning" && (
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m8 2 6 11H2L8 2z" />
            <line x1="8" y1="6" x2="8" y2="9" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
        )}
        {type === "important" && (
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 1.5 2 4.5v5c0 3.5 3 5.5 6 6 3-.5 6-2.5 6-6v-5L8 1.5z" />
          </svg>
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className={`font-semibold font-mono text-xs uppercase tracking-wide ${styles.titleColor}`}>
          {title ?? styles.defaultTitle}
        </div>
        <div className="text-neutral-200">{children}</div>
      </div>
    </div>
  );
}
