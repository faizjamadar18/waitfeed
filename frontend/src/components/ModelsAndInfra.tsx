import Image from "next/image";

export function ModelsAndInfra() {
  return (
    <>
      {/* Section: Intelligence */}
      <section id="sources" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
        <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
              <span className="font-decima text-[10px] uppercase tracking-widest text-[#fcaa2d]">
                Intelligence
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918] max-w-180">
              Technical briefs with{" "}
              <strong className="font-display font-normal text-black">zero hallucinations</strong>
            </h2>
            <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
              Concise, 180-character developer briefs synthesized strictly from fetched repo descriptions and technical metadata using your host agent&apos;s local session. Enforces a strict substance gate (&ge;80 chars) and answers NEEDS_MORE to refuse padding or invented claims.
            </p>
          </div>

          {/* Visual: Intelligence Pipeline Box */}
          <div className="relative aspect-1596/900 w-full rounded-xs overflow-hidden border border-[#e3e2d8] bg-[#f3f2e7]">
            <Image
              src="https://framerusercontent.com/images/mWLbIwwLqHeiCLK0erqv1TEvdY.webp?width=1596&height=900"
              alt="Distant rocky peaks beneath layered clouds in a warm-toned landscape."
              fill
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />
            {/* Centered Intelligence Verification Card */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[72%] max-w-170 p-4 sm:p-7 rounded-xs border border-white/20 shadow-2xl font-mono text-white select-none"
              style={{
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(22, 22, 21, 0.92)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[10px] sm:text-xs">
                <span className="text-[#fcaa2d] font-bold">PIPELINE VERIFICATION GATE</span>
                <span className="text-white/40 font-decima">DOOR 1 &amp; DOOR 2</span>
              </div>
              <div className="py-3 flex flex-col gap-2.5 text-[9px] sm:text-[11px] leading-relaxed text-white/80">
                <div className="flex items-start gap-2">
                  <span className="text-[#3fb950] font-bold">01</span>
                  <span><strong className="text-white">Substance Check:</strong> Only items with &ge;80 chars of technical description enter the model. Thin clickbait is filtered before generation.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#fcaa2d] font-bold">02</span>
                  <span><strong className="text-white">NEEDS_MORE Handshake:</strong> The model must respond with NEEDS_MORE if metadata lacks real substance. No web searches, no invented facts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#8a63f4] font-bold">03</span>
                  <span><strong className="text-white">Honest Fallback:</strong> If the local story layer is unavailable, the entire view cleanly drops back to headline mode. Looks are never mixed.</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/40 font-decima">
                <span>LOCAL CACHE: ~/.config/waitfeed/cache.json</span>
                <span className="text-[#98c379]">100% LOCAL PRIVACY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Ecosystem */}
      <section id="ecosystem" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
        <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
              <span className="font-decima text-[10px] uppercase tracking-widest text-[#fcaa2d]">
                Ecosystem
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918] max-w-180">
              One shared engine across{" "}
              <strong className="font-display font-normal text-black">OpenCode, AGY &amp; Claude Code</strong>
            </h2>
            <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
              A decoupled core engine in core/pipeline.ts powers all three environments. OpenCode renders reactive OpenTUI Solid components above the prompt line, AGY drives live session statusline hooks with wall-clock dwell timing, and Claude Code triggers on active wait states.
            </p>
          </div>

          {/* Visual: Tri-Agent Architecture Box */}
          <div className="relative aspect-1596/900 w-full rounded-xs overflow-hidden border border-[#e3e2d8] bg-[#f3f2e7]">
            <Image
              src="https://framerusercontent.com/images/Bj6BdvVC7GNAWhZbDFhJ2X9rTFI.webp?width=1596&height=900"
              alt="Mountain ridge at sunset with trees in the foreground"
              fill
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />
            {/* Centered Architecture Card */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] sm:w-[75%] max-w-180 p-4 sm:p-7 rounded-xs border border-white/20 shadow-2xl font-mono text-white select-none"
              style={{
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(22, 22, 21, 0.92)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[10px] sm:text-xs">
                <span className="text-[#fcaa2d] font-bold">UNIFIED AGENT INTEGRATIONS</span>
                <span className="text-white/40 font-decima">3 HOST PLATFORMS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-[9px] sm:text-[11px]">
                <div className="p-3 rounded-xs bg-white/5 border border-white/10 flex flex-col gap-1.5">
                  <span className="text-[#fcaa2d] font-bold">OpenCode</span>
                  <span className="text-white/60 text-[10px]">Slot-rendered Solid TUI above composer + /news command</span>
                </div>
                <div className="p-3 rounded-xs bg-white/5 border border-white/10 flex flex-col gap-1.5">
                  <span className="text-[#3fb950] font-bold">Antigravity (AGY)</span>
                  <span className="text-white/60 text-[10px]">SessionStart scheduler hook + wall-clock dwell statusline</span>
                </div>
                <div className="p-3 rounded-xs bg-white/5 border border-white/10 flex flex-col gap-1.5">
                  <span className="text-[#8a63f4] font-bold">Claude Code</span>
                  <span className="text-white/60 text-[10px]">Wait-state ticker integration during model execution</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/40 font-decima">
                <span>SHARED STORAGE: ~/.config/waitfeed/config.json</span>
                <span className="text-[#fcaa2d]">30-MIN BACKGROUND REFRESH</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
