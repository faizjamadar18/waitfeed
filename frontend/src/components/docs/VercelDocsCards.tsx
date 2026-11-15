"use client";

import { type ReactNode } from "react";

interface VercelCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  badge?: string;
  href?: string;
  onClick?: () => void;
  meta?: string;
}

export function VercelCard({
  title,
  description,
  icon,
  badge,
  href,
  onClick,
  meta,
}: VercelCardProps) {
  const content = (
    <div className="relative h-full flex flex-col justify-between p-5 rounded-xl border border-neutral-800 bg-[#0a0a0a] hover:bg-[#121212] hover:border-neutral-700 transition-all duration-200 group overflow-hidden">
      <div>
        {/* Top row: Icon + Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {icon ? (
            <div className="w-9 h-9 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-center text-white group-hover:border-neutral-700 group-hover:bg-neutral-800/80 transition-colors">
              {icon}
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          )}
          {badge && (
            <span className="text-[10px] font-mono font-medium tracking-wide uppercase px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 group-hover:text-amber-300 group-hover:border-amber-500/30 transition-colors">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center justify-between">
          <span>{title}</span>
          <span className="text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all text-sm">
            →
          </span>
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mt-2">
          {description}
        </p>
      </div>

      {meta && (
        <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
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
        className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400/50 rounded-xl"
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

export function VercelCardGrid({
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

  return <div className={`grid ${colClass} gap-4 my-6`}>{children}</div>;
}
