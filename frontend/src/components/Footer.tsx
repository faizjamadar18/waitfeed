"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { WaitFeedBrand, GitHubIcon, LinkedInIcon } from "./Icons";
import { RELACE_EASE } from "@/lib/motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: RELACE_EASE }}
      className="w-full bg-[#fffef2] pt-0 pb-12 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-266 flex flex-col">
        {/* Footer Top Row: Logo, Links, Socials */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-5 py-5">
          {/* Left: Logo */}
          <Link
            href="/"
            aria-label="WaitFeed home"
            className="group logo flex items-center text-[#191918] focus-visible:outline-hidden"
          >
            <WaitFeedBrand />
          </Link>

          {/* Middle: Important Section Nav Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link
              href="#how-it-works"
              className="font-parabole text-xs font-normal uppercase tracking-[0.04em] text-[#191918] hover:text-black transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="font-parabole text-xs font-normal uppercase tracking-[0.04em] text-[#191918] hover:text-black transition-colors"
            >
              Features
            </Link>
            <Link
              href="#faq"
              className="font-parabole text-xs font-normal uppercase tracking-[0.04em] text-[#191918] hover:text-black transition-colors"
            >
              FAQ
            </Link>
          </div>

          {/* Right: Socials (GitHub, LinkedIn) */}
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-[#191918] hover:opacity-70 transition-opacity"
            >
              <GitHubIcon className="w-5 h-5" />
            </Link>
            <Link
              href="https://www.linkedin.com/in/faiz-jamadar-2859732a4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-[#191918] hover:opacity-70 transition-opacity"
            >
              <LinkedInIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1px Divider Line */}
        <div className="w-full h-px bg-[#191918]/5 mx-auto" />

        {/* Footer Bottom Row: Copyright on Left, Legal on Right */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-5 text-[10px] text-[#191918]/60 font-parabole">
          <div>
            Copyright © 2026 WaitFeed
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              npm Package
            </Link>
            <Link
              href="https://github.com/faizjamadar18/waitfeed/issues/new?title=%5BFeed+Request%5D%3A+&labels=enhancement&body=**Feed+Name%2FURL%3A**%0A%0A**Why+it's+worth+adding%3A**"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              Suggest a Feed
            </Link>
            <Link
              href="https://github.com/faizjamadar18/waitfeed/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              Changelog
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
