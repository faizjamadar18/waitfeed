import Image from "next/image";
import { CtaButton } from "./CtaButton";

export function CtaSection() {
  return (
    <section id="get-started" className="w-full pt-28 pb-0 px-5 sm:px-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-266 flex flex-col items-center justify-center">
        {/* Top CTA Row: Left Heading/Subtitle + Right Buttons (matches Relace #framer-7ynk1o) */}
        <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-5 pb-10">
          {/* Left: Heading & Subtitle */}
          <div className="flex-1 flex flex-col items-start gap-3">
            <h2 className="text-4xl sm:text-5xl md:text-[64px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-black">
              Get started in{" "}
              <strong className="font-display font-normal text-[#fcaa2d]">minutes</strong>
            </h2>
            <p className="text-base sm:text-lg font-parabole leading-normal text-[#191918]/60 max-w-140">
              Try out our playground, and start with our free tier to test Relace models in your application.
            </p>
          </div>

          {/* Right: Buttons */}
          <div className="flex flex-row items-center gap-4 shrink-0">
            {/* GET A DEMO (Accent Orange Button) */}
            <CtaButton
              href="https://cal.com/team/relace/30min"
              target="_blank"
              variant="accent"
              showArrow
              className="px-5 py-4 uppercase text-xs tracking-[0.04em] rounded-none"
            >
              Get a Demo
            </CtaButton>

            {/* SIGN UP FOR FREE (Light Beige Button) */}
            <CtaButton
              href="https://app.relace.ai/sign-up"
              target="_blank"
              variant="beige"
              showArrow
              className="px-5 py-4 uppercase text-xs tracking-[0.04em] rounded-none hover:bg-[#eae8df] hover:text-[#191918]"
            >
              Sign Up for Free
            </CtaButton>
          </div>
        </div>

        {/* Panoramic Mountain Landscape (Matches Relace: height 200px, full-width) */}
        <div className="w-full h-50 relative overflow-hidden bg-[#e3e2d8]">
          <Image
            src="https://framerusercontent.com/images/CxcNTpe5oLKUDB43wY2Icj87s.png?width=1596&height=522"
            alt="Panoramic view of jagged mountain peaks fading into a muted, cloudy horizon."
            fill
            sizes="(min-width: 1200px) 1064px, 100vw"
            className="w-full h-full object-cover object-center select-none"
          />
        </div>
      </div>
    </section>
  );
}
