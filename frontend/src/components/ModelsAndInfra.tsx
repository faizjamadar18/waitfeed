import Image from "next/image";

export function ModelsAndInfra() {
  return (
    <section id="models" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-20 sm:gap-28">
        {/* fig 001 — Models */}
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
              <span className="font-decima text-[10px] uppercase tracking-widest text-[#191918]/70">
                Models
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.15] tracking-[-0.04em] text-[#191918] max-w-175">
              State of the art SLMs as{" "}
              <strong className="font-display font-bold">tools</strong> for coding agents
            </h2>
            <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
              Small, fast models trained in-house to outperform frontier LLMs on utility tasks and save on agent costs. Compact context at 50,000 tok/s, and search an entire codebase in seconds.
            </p>
          </div>

          {/* Visual fig 001 */}
          <div className="relative aspect-video w-full rounded-xs overflow-hidden border border-[#e3e2d8] bg-[#f3f2e7]">
            <Image
              src="https://framerusercontent.com/images/mWLbIwwLqHeiCLK0erqv1TEvdY.webp?width=1596&height=900"
              alt="Distant rocky peaks beneath layered clouds in a warm-toned landscape."
              fill
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />
            {/* Technical fig label */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-2.5 py-1 rounded-xs bg-white/70 backdrop-blur-xs border border-[#191918]/10 text-[10px] font-decima uppercase text-[#191918] tracking-widest pointer-events-none z-10">
              fig 001
            </div>
          </div>
        </div>

        {/* fig 003 — Infra */}
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
              <span className="font-decima text-[10px] uppercase tracking-widest text-[#191918]/70">
                Infra
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.15] tracking-[-0.04em] text-[#191918] max-w-175">
              Source control designed for the{" "}
              <strong className="font-display font-bold">models</strong> using it
            </h2>
            <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
              Lightweight push/pull operation from sandboxes, fast branching for spawning subagents, and rate limits designed for high throughput.
            </p>
          </div>

          {/* Visual fig 003 */}
          <div className="relative aspect-video w-full rounded-xs overflow-hidden border border-[#e3e2d8] bg-[#f3f2e7]">
            <Image
              src="https://framerusercontent.com/images/Bj6BdvVC7GNAWhZbDFhJ2X9rTFI.webp?width=1596&height=900"
              alt="Mountain ridge at sunset with trees in the foreground"
              fill
              sizes="(min-width: 1200px) 1064px, (max-width: 809.98px) calc(100vw - 40px), 920px"
              className="w-full h-full object-cover select-none"
            />
            {/* Technical fig label */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-2.5 py-1 rounded-xs bg-white/70 backdrop-blur-xs border border-[#191918]/10 text-[10px] font-decima uppercase text-[#191918] tracking-widest pointer-events-none z-10">
              fig 003
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
