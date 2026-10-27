"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CtaButton } from "./CtaButton";
import { CopyCommandButton } from "./CopyCommandButton";
import { RELACE_EASE, relaceViewport, transitionWithDelay } from "@/lib/motion";

export function CtaSection() {
  return (
    <section id="install" className="w-full pt-28 pb-0 px-5 sm:px-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-266 flex flex-col items-center justify-center">
        {/* Top CTA Row: Left Heading/Subtitle + Right Buttons (matches Relace #framer-7ynk1o) */}
        <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-5 pb-10">
          {/* Left: Heading & Subtitle */}
          <div className="flex-1 flex flex-col items-start gap-3">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={relaceViewport}
              transition={transitionWithDelay(0)}
              className="text-4xl sm:text-5xl md:text-[64px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-black whitespace-nowrap"
            >
              Get started in{" "}
              <strong className="font-display font-normal text-[#fcaa2d]">minutes</strong>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={relaceViewport}
              transition={transitionWithDelay(0.05)}
              className="text-base sm:text-lg font-parabole leading-normal text-[#191918]/60 max-w-140"
            >
              Turn boring agent wait time into your personal tech feed. One simple command, zero configuration, and completely free.
            </motion.p>
          </div>

          {/* Right: Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={relaceViewport}
            transition={transitionWithDelay(0.1)}
            className="flex flex-row items-center gap-4 shrink-0"
          >
            {/* npx waitfeed init (Accent Yellow Button) */}
            <CopyCommandButton
              className="px-5 py-4 text-xs tracking-[0.04em] rounded-none font-medium"
              roundedNone
            />

            {/* VIEW ON GITHUB (Light Beige Button) */}
            <CtaButton
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              variant="beige"
              showArrow
              className="px-6 py-5 uppercase text-[11px]! tracking-[0.04em] rounded-none"
            >
              View on GitHub
            </CtaButton>
          </motion.div>
        </div>

        {/* Panoramic Mountain Landscape (Matches Relace: height 200px, full-width) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={relaceViewport}
          transition={{ duration: 0.7, ease: RELACE_EASE, delay: 0.15 }}
          className="w-full h-50 relative overflow-hidden bg-[#e3e2d8]"
        >
          <Image
            src="https://framerusercontent.com/images/CxcNTpe5oLKUDB43wY2Icj87s.png?width=1596&height=522"
            alt="Panoramic view of jagged mountain peaks fading into a muted, cloudy horizon."
            fill
            sizes="(min-width: 1200px) 1064px, 100vw"
            className="w-full h-full object-cover object-center select-none"
          />
        </motion.div>
      </div>
    </section>
  );
}
