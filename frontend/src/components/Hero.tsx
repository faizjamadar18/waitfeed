"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CtaButton } from "./CtaButton";
import { HeroTerminal } from "./HeroTerminal";
import { CopyCommandButton } from "./CopyCommandButton";
import { RELACE_EASE } from "@/lib/motion";

export function Hero() {
  return (
    <section id="hero" className="w-full pt-16 min-[810px]:pt-28 pb-12 min-[810px]:pb-20">
      {/* Reference shell: 480 / 920 / 1064 inner widths at phone / tablet / desktop.
          The outer max-width adds the 40px (or 20px) gutters of the reference. */}
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-5 min-[810px]:max-w-[1000px] min-[810px]:gap-10 min-[810px]:px-10 min-[1200px]:max-w-266">
        {/* Header Row: Left Title & Right Paragraph with Action Buttons */}
        <div className="flex w-full flex-col items-start justify-between gap-6 pb-10 min-[810px]:flex-row min-[810px]:px-5 min-[810px]:pb-16">
          {/* Left Column: Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: RELACE_EASE, delay: 0 }}
            className="w-full font-parabole text-[40px] font-normal leading-[1.1] tracking-[-0.05em] text-[#191918] min-[810px]:w-px min-[810px]:flex-1 min-[810px]:text-[52px] min-[1200px]:text-[64px]"
          >
            Tech feed <strong className="font-display font-normal text-black">inside</strong>
            {" "}agent <strong className="font-display font-normal text-black">wait time</strong>
          </motion.h1>

          {/* Right Column: Paragraph and Action CTAs */}
          <div className="flex w-full flex-col gap-6 min-[810px]:w-px min-[810px]:flex-1 min-[810px]:max-w-115">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: RELACE_EASE, delay: 0.05 }}
              className="text-[18px] text-[#191918]/60 font-parabole leading-normal"
            >
              Turn every agent wait into a tech briefing. Fresh dev stories, repos, and discussions stream in your terminal while your AI works. 
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: RELACE_EASE, delay: 0.1 }}
              className="flex items-center gap-4 flex-wrap"
            >
              <CopyCommandButton className="px-4 min-[1200px]:px-5 py-3 text-xs tracking-wider font-medium" />
              <CtaButton
                href="https://www.npmjs.com/package/waitfeed"
                target="_blank"
                rel="noopener noreferrer"
                variant="beige"
                className="px-6 py-4 text-[11px]! uppercase tracking-wider font-medium font-parabole"
              >
                npm
              </CtaButton>
            </motion.div>
          </div>
        </div>

        {/* Hero Visual: a 1596/900 frame at every width (no min-height, no inner padding),
            with the terminal parked at the reference anchor (54% height, centred).
            Width is the old `max-w-140` (560px) capped, so desktop matches the previous
            mock exactly and smaller screens scale down with the image. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: RELACE_EASE, delay: 0.15 }}
          className="w-full relative rounded-xs overflow-hidden border border-[#e3e2d8] shadow-xs"
        >
          <div className="relative aspect-[1596/900] w-full overflow-hidden bg-[#e3e2d8]">
            <Image
              src="https://framerusercontent.com/images/IpHIdqVoOMzhY8zkGb0SKdPFg0.webp?width=1596&height=900"
              alt="Wide mountain range beneath a cloudy sky with subtle geometric overlay graphics."
              fill
              priority
              sizes="(min-width: 1200px) 984px, (min-width: 810px) calc(100vw - 80px), calc(100vw - 40px)"
              className="w-full h-full object-cover object-center select-none"
            />

            {/* Terminal slot — 70% of the image, capped at the previous 560px width */}
            <div className="absolute left-1/2 top-[54%] z-10 aspect-[560/408] w-[70%] max-w-[560px] -translate-x-1/2 -translate-y-1/2">
              <HeroTerminal />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
