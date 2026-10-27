"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { RELACE_EASE } from "@/lib/motion";

interface CopyCommandButtonProps {
  className?: string;
  command?: string;
  roundedNone?: boolean;
}

export function CopyCommandButton({
  className = "px-5 py-3 text-xs tracking-wider font-medium",
  command = "npx waitfeed init",
  roundedNone = false,
}: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [command]);

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ scale: 1.015, transition: { duration: 0.2, ease: RELACE_EASE } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: RELACE_EASE } }}
      aria-label={copied ? "Command copied to clipboard" : `Copy command: ${command}`}
      title={copied ? "Copied!" : "Click to copy command"}
      className={`group relative inline-flex items-center justify-center gap-3 select-none ${
        roundedNone ? "rounded-none" : "rounded-xs"
      } bg-[#fcaa2d] text-[#191918] hover:brightness-105 active:brightness-95 transition-colors duration-300 focus:outline-none cursor-pointer overflow-hidden ${className}`}
    >
      <span className="relative z-10 font-decima font-medium lowercase tracking-wide text-xs sm:text-sm">
        {command}
      </span>

      {/* Copy SVG icon — switches to checkmark when copied */}
      <span className="relative z-10 w-4 h-4 shrink-0 inline-flex items-center justify-center">
        {copied ? (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-3.5 h-3.5 stroke-[#191918] animate-in fade-in duration-200"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 8.5 6.5 12 13 4" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-3.5 h-3.5 stroke-[#191918] transition-transform duration-200 group-hover:scale-110"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" />
            <path d="M10.5 3.5H4a1.2 1.2 0 0 0-1.2 1.2v6.5" />
          </svg>
        )}
      </span>
    </motion.button>
  );
}
