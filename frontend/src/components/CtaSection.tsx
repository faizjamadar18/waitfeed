import Link from "next/link";
import Image from "next/image";

export function CtaSection() {
  return (
    <section className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="text-4xl sm:text-5xl md:text-[52px] font-parabole font-normal leading-[1.1] tracking-tighter text-[#191918]">
          Get started in{" "}
          <span className="text-[#fcaa2d]">
            <strong className="font-display font-bold">minutes</strong>
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#191918]/60 font-parabole max-w-140 leading-relaxed">
          Try out our playground, and start with our free tier to test Relace models in your application.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-7 flex items-center justify-center gap-3">
          <Link
            href="https://cal.com/team/relace/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium px-4 py-2 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7] hover:bg-[#eae9de] text-[#191918] transition-colors"
          >
            Get a Demo
          </Link>
          <Link
            href="https://app.relace.ai/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium px-4 py-2 rounded-xs bg-[#191918] text-white hover:bg-black transition-colors"
          >
            Sign Up for Free
          </Link>
        </div>

        {/* Panoramic Mountain Landscape */}
        <div className="w-full mt-10 sm:mt-14 relative rounded-xs overflow-hidden border border-[#e3e2d8]">
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
