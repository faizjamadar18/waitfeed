"use client";

import { type ReactNode } from "react";

interface DocsCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  badge?: string;
  href?: string;
  onClick?: () => void;
  meta?: string;
}

export function DocsCard({
  title,
  description,
  icon,
  badge,
  href,
  onClick,
  meta,
}: DocsCardProps) {
  const content = (
    <div className="relative h-full flex flex-col justify-between p-4.5 sm:p-5 rounded-xl border border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-900/30 transition-colors group">
      <div>
        {/* Top row if icon or badge exists */}
        {(icon || badge) && (
          <div className="flex items-center justify-between gap-3 mb-3">
            {icon ? (
              <div className="shrink-0 flex items-center">
                {icon}
              </div>
            ) : <span />}
            {badge && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-neutral-800 bg-neutral-900/70 text-neutral-400">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-neutral-100 group-hover:text-white tracking-tight flex items-center justify-between gap-2">
          <span>{title}</span>
          {(href || onClick) && (
            <span
              aria-hidden="true"
              className="text-neutral-500 group-hover:text-neutral-300 transition-colors text-xs"
            >
              →
            </span>
          )}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mt-1.5">
          {description}
        </p>
      </div>

      {meta && (
        <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>{meta}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="block focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-neutral-400 rounded-xl"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={onClick ? "cursor-pointer focus-visible:outline-hidden" : undefined}
    >
      {content}
    </div>
  );
}

export function DocsCardGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return <div className={`grid ${colClass} gap-3.5 my-5`}>{children}</div>;
}
