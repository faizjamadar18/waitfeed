"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { WaitFeedBrand } from "./Icons";
import { CtaButton } from "./CtaButton";
import { RELACE_EASE } from "@/lib/motion";

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: RELACE_EASE }}
      className="relative z-40 w-full bg-[#fffef2] transition-colors"
    >
      <div className="max-w-266 mx-auto px-5 sm:px-10 h-16 sm:h-18 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/"
          aria-label="WaitFeed home"
          className="group logo flex items-center text-[#191918] focus-visible:outline-hidden"
        >
          <WaitFeedBrand />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/faizjamadar18/waitfeed#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 text-xs font-parabole font-medium text-[#191918] uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            DOCS
          </Link>
          <CtaButton
            href="https://github.com/faizjamadar18/waitfeed"
            target="_blank"
            variant="accent"
            showArrow
            className="py-2! pl-4! pr-3! gap-1.5! text-[11px]! font-medium! uppercase tracking-wider text-[#191918]!"
          >
            GITHUB
          </CtaButton>
        </div>
      </div>
    </motion.header>
  );
}
