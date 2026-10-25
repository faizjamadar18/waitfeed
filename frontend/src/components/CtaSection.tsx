import Image from "next/image";
import { CtaButton } from "./CtaButton";

export function CtaSection() {
  return (
    <section id="install" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="text-4xl sm:text-5xl md:text-[64px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918]">
          Launch in{" "}
          <span className="text-[#fcaa2d]">
            <strong className="font-display font-normal">30 seconds</strong>
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#191918]/60 font-parabole max-w-140 leading-relaxed">
          Run the interactive setup wizard in your terminal. Detects your active agent (OpenCode, AGY, or Claude Code), configures your preferred tech streams, and begins streaming updates immediately.
        </p>

        {/* Terminal Command Box */}
        <div className="mt-7 sm:mt-8 flex items-center justify-between gap-4 px-5 py-3 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7] font-mono text-xs sm:text-sm max-w-115 w-full shadow-xs">
          <div className="flex items-center gap-2 text-[#191918]">
            <span className="text-[#fcaa2d] font-bold select-none">&gt;</span>
            <span className="select-all font-medium">npx waitfeed init</span>
          </div>
          <span className="text-[10px] text-[#191918]/50 font-decima uppercase tracking-wider select-none">
            INTERACTIVE CLI
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <CtaButton
            href="https://github.com/faizjamadar18/waitfeed#readme"
            target="_blank"
            variant="accent"
          >
            Read Documentation
          </CtaButton>
          <CtaButton
            href="https://github.com/faizjamadar18/waitfeed"
            target="_blank"
            variant="beige"
          >
            View on GitHub
          </CtaButton>
        </div>

        {/* Panoramic Mountain Landscape */}
        <div className="w-full mt-10 sm:mt-16 relative rounded-xs overflow-hidden border border-[#e3e2d8]">
          <div className="relative aspect-1596/522 w-full overflow-hidden bg-[#e3e2d8]">
            <Image
              src="https://framerusercontent.com/images/CxcNTpe5oLKUDB43wY2Icj87s.png?width=1596&height=522"
              alt="Panoramic view of jagged mountain peaks fading into a muted, cloudy horizon."
              fill
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
