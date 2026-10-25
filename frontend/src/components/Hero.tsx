import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section id="hero" className="w-full pt-32 sm:pt-36 pb-12 sm:pb-16">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col items-center text-center">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-[52px] font-parabole font-normal leading-[1.1] tracking-tighter text-[#191918] max-w-200">
          Models <strong className="font-display font-bold">built</strong> for coding{" "}
          <strong className="font-display font-bold">agents</strong>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#191918]/60 font-parabole max-w-160 leading-relaxed">
          Source control with out-of-the box codebase retrieval, fast utility SLMs, and task-specific agents you can run on&nbsp;any repo.
        </p>

        {/* CTA Buttons */}
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

        {/* Hero Visual */}
        <div className="w-full mt-10 sm:mt-14 relative rounded-xs overflow-hidden border border-[#e3e2d8] shadow-xs">
          <div className="relative aspect-video w-full overflow-hidden bg-[#e3e2d8]">
            <Image
              src="https://framerusercontent.com/images/IpHIdqVoOMzhY8zkGb0SKdPFg0.webp?width=1596&height=900"
              alt="Wide mountain range beneath a cloudy sky with subtle geometric overlay graphics."
              fill
              priority
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />
            {/* Frosted HUD overlay */}
            <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5 pointer-events-none flex flex-col justify-between p-4 sm:p-6 text-[10px] font-decima text-[#191918]/40 uppercase tracking-widest z-10">
              <div className="flex items-center justify-between">
                <span>relace.mesh // v1.0</span>
                <span>lat: 37.7749 // lon: -122.4194</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d] animate-pulse" />
                  active agent cluster
                </span>
                <span>50,000 tok/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
