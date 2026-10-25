import Link from "next/link";
import React from "react";

interface CtaButtonProps {
  href: string;
  variant?: "accent" | "beige" | "ghost" | "dark";
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

export function CtaButton({
  href,
  variant = "accent",
  children,
  className = "",
  target,
  rel,
  onClick,
  showArrow,
}: CtaButtonProps) {
  // Accent = yellow background with dark text
  // Beige = light beige background that turns black on hover with white text
  // Ghost = small beige outline
  // Dark = black background with white text

  const baseClasses =
    "group relative inline-flex items-center justify-center gap-3 select-none rounded-xs transition-all duration-300 focus:outline-none cursor-pointer overflow-hidden";

  const sizeClasses =
    variant === "ghost"
      ? "px-3 py-1.5 text-xs font-normal"
      : "px-5 py-3 text-xs sm:text-sm font-normal tracking-wide";

  let colorClasses = "";
  if (variant === "accent") {
    colorClasses = "bg-[#fcaa2d] text-[#191918] hover:brightness-105 active:brightness-95";
  } else if (variant === "beige") {
    colorClasses =
      "bg-[#f3f2e7] text-[#191918] hover:bg-[#191918] hover:text-[#fffef2] active:bg-black";
  } else if (variant === "dark") {
    colorClasses = "bg-[#191918] text-[#fffef2] hover:bg-[#2c2c2a] active:bg-black";
  } else if (variant === "ghost") {
    colorClasses =
      "border border-[#e3e2d8] bg-[#f3f2e7]/80 text-[#191918] hover:bg-[#f3f2e7] hover:border-[#191918]/20";
  }

  const isExternal = href.startsWith("http") || href.startsWith("mailto");

  return (
    <Link
      href={href}
      target={target || (isExternal ? "_blank" : undefined)}
      rel={rel || (isExternal ? "noopener noreferrer" : undefined)}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="relative z-10 font-parabole">{children}</span>

      {/* Dual sliding arrow icon */}
      {(showArrow ?? (variant !== "ghost")) && (
        <span className="relative z-10 w-4 h-4 overflow-hidden shrink-0 inline-flex items-center justify-center">
          {/* Default arrow */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-3.5 h-3.5 absolute top-0 left-0 transition-transform duration-300 ease-out group-hover:-translate-y-4 group-hover:translate-x-4"
            stroke="currentColor"
            strokeWidth="1.25"
          >
            <path
              d="M 11.681 0.441 L 0 12.121 M 2.909 0 L 11.152 0 C 11.687 0 12.121 0.433 12.121 0.97 L 12.121 9.213"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Incoming hover arrow */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-3.5 h-3.5 absolute -bottom-4 -left-4 transition-transform duration-300 ease-out group-hover:-translate-y-4 group-hover:translate-x-4"
            stroke="currentColor"
            strokeWidth="1.25"
          >
            <path
              d="M 11.681 0.441 L 0 12.121 M 2.909 0 L 11.152 0 C 11.687 0 12.121 0.433 12.121 0.97 L 12.121 9.213"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </Link>
  );
}
