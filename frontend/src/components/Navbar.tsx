"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { WaitFeedBrand } from "./Icons";
import { CtaButton } from "./CtaButton";
import { RELACE_EASE } from "@/lib/motion";

export function Navbar() {
  const pathname = usePathname();
  const isDocs = pathname === "/docs";

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
          <WaitFeedBrand
            markClassName="w-6 h-6 sm:w-7 sm:h-7"
            textClassName="text-[19px] sm:text-[22px]"
          />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            aria-current={isDocs ? "page" : undefined}
            className={`px-2.5 py-1.5 text-xs font-parabole font-medium uppercase tracking-wider transition-opacity inline-flex items-center gap-1.5 ${
              isDocs
                ? "text-[#191918]"
                : "text-[#191918] hover:opacity-80"
            }`}
          >
            {isDocs && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" aria-hidden="true" />
            )}
            DOCS
          </Link>
          <CtaButton
            href="https://github.com/faizjamadar18/waitfeed"
            target="_blank"
            variant="accent"
            showArrow
            className="py-2! pl-3! pr-2.5! sm:pl-4! sm:pr-3! gap-1.5! text-[11px]! font-medium! uppercase tracking-wider text-[#191918]!"
          >
            GITHUB
          </CtaButton>
        </div>
      </div>
    </motion.header>
  );
}
