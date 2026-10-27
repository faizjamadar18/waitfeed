"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CtaButton } from "./CtaButton";
import { HeroTerminal } from "./HeroTerminal";
import { CopyCommandButton } from "./CopyCommandButton";
import { RELACE_EASE } from "@/lib/motion";

export function Hero() {
  return (
    <section id="hero" className="w-full pt-24 sm:pt-28 pb-12 sm:pb-20">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-10 sm:gap-14">
        {/* Header Row: Left Title & Right Paragraph with Action Buttons */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12 w-full text-left">
          {/* Left Column: Heading */}
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: RELACE_EASE, delay: 0 }}
              className="text-4xl sm:text-5xl md:text-[54px] lg:text-[64px] font-parabole font-normal leading-[1.08] tracking-[-0.045em] text-[#191918]"
            >
              Tech feed <strong className="font-display font-normal text-black">inside</strong>
              <br className="hidden sm:inline" />{" "}
              agent <strong className="font-display font-normal text-black">wait time</strong>
            </motion.h1>
          </div>

          {/* Right Column: Paragraph and Action CTAs */}
          <div className="flex-1 max-w-115 flex flex-col gap-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: RELACE_EASE, delay: 0.05 }}
              className="text-base sm:text-[18px] text-[#191918]/60 font-parabole leading-normal"
            >
              Turn every agent wait into a tech briefing. Fresh dev stories, repos, and discussions stream in your terminal while your AI works. 
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: RELACE_EASE, delay: 0.1 }}
              className="flex items-center gap-3 sm:gap-4 flex-wrap"
            >
              <CopyCommandButton className="px-5 py-3 text-xs tracking-wider font-medium" />
              <CtaButton
                href="https://www.npmjs.com/package/waitfeed"
                target="_blank"
                rel="noopener noreferrer"
                variant="beige"
                className="px-6 py-4 text-[11px]! uppercase tracking-wider font-medium font-parabole"
              >
                View on npm
              </CtaButton>
            </motion.div>
          </div>
        </div>

        {/* Hero Visual Image with Floating Interactive Code Editor Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: RELACE_EASE, delay: 0.15 }}
          className="w-full relative rounded-xs overflow-hidden border border-[#e3e2d8] shadow-xs"
        >
          <div className="relative min-h-115 sm:min-h-130 md:aspect-1596/900 w-full overflow-hidden bg-[#e3e2d8] flex items-center justify-center p-3 sm:p-6 lg:p-10">
            <Image
              src="https://framerusercontent.com/images/IpHIdqVoOMzhY8zkGb0SKdPFg0.webp?width=1596&height=900"
              alt="Wide mountain range beneath a cloudy sky with subtle geometric overlay graphics."
              fill
              priority
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />

            {/* Centered Floating Animated & Interactive Code Editor Window */}
            <div className="relative z-10 w-full max-w-140">
              <HeroTerminal />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
