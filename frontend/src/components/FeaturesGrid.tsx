import {
  BrainIcon,
  RadarIcon,
  BranchIcon,
  GaugeIcon,
  PlugIcon,
  ShieldIcon,
} from "./Icons";

interface FeatureCardItem {
  id: string;
  title: string;
  number: string;
  icon: typeof BrainIcon;
}

const FEATURES: FeatureCardItem[] = [
  {
    id: "f1",
    title: "honest limits contract",
    number: "No. 1",
    icon: BrainIcon,
  },
  {
    id: "f2",
    title: "pure tech radar",
    number: "No. 2",
    icon: RadarIcon,
  },
  {
    id: "f3",
    title: "36h persistent pool",
    number: "No. 3",
    icon: BranchIcon,
  },
  {
    id: "f4",
    title: "zero-latency hide",
    number: "No. 4",
    icon: GaugeIcon,
  },
  {
    id: "f5",
    title: "tri-agent support",
    number: "No. 5",
    icon: PlugIcon,
  },
  {
    id: "f6",
    title: "100% local & keyless",
    number: "No. 6",
    icon: ShieldIcon,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="w-full pt-24 pb-0 px-5 sm:px-10 flex flex-col items-center justify-center border-t border-[#e3e2d8]">
      <div className="w-full max-w-266 flex flex-col items-center justify-center gap-10">
        {/* Header (matches Relace Header #features-header: 20px gap, 0 20px padding) */}
        <div className="w-full flex flex-col items-start justify-start gap-5 px-5">
          {/* Overline (gap: 10px, 6px x 5px dot) */}
          <div className="flex flex-row items-center gap-2.5">
            <span className="w-1.5 h-1.25 bg-[#fcaa2d] shrink-0" />
            <span className="font-decima text-[10px] leading-[1.1] tracking-[0.03em] uppercase text-[#fcaa2d]">
              Features
            </span>
          </div>

          {/* Heading (matches Relace: 40px desktop, 36px tablet, 32px mobile, 110% line-height, -0.04em letter-spacing) */}
          <h2 className="text-[32px] sm:text-[36px] md:text-[40px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-black">
            Engineered for{" "}
            <strong className="font-display font-normal text-black">terminal focus</strong>
          </h2>

          {/* Subtitle (matches Relace: 16px, 150% line-height, color rgba(25, 25, 24, 0.6)) */}
          <p className="text-base font-parabole leading-normal tracking-normal text-[#191918]/60 max-w-160">
            Zero ads, zero accounts, zero cloud backends. A local-first developer intelligence layer built specifically for the latency windows of autonomous coding agents.
          </p>
        </div>

        {/* 6 Feature Cards Grid (matches Relace #features-cards: 20px padding, 20px gap, 3 cols) */}
        <div className="w-full p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className="flex flex-col items-start gap-3 w-full">
                {/* Card Box (matches Relace: height 150px, padding 20px, bg #d1d0c666 = rgba(209, 208, 198, 0.4), overflow clip) */}
                <div className="w-full h-37.5 p-5 flex flex-col justify-between items-start bg-[#d1d0c6]/40 overflow-hidden">
                  {/* Top-left Icon (matches Relace: 32px x 32px, text-[#191918]/50) */}
                  <Icon className="w-8 h-8 text-[#191918]/50 shrink-0" />

                  {/* Bottom-left Title (matches Relace: 16px, Decima Mono, uppercase, 0.04em letter-spacing, 1.1 line-height) */}
                  <p className="font-decima text-base font-normal leading-[1.1] tracking-[0.04em] uppercase text-[#191918]">
                    {feat.title}
                  </p>
                </div>

                {/* Below Card Number (matches Relace: 10px, Decima Mono, uppercase, 0.03em letter-spacing, 1.1 line-height, 12px gap below card) */}
                <p className="font-decima text-[10px] font-normal leading-[1.1] tracking-[0.03em] uppercase text-[#191918]">
                  {feat.number}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
