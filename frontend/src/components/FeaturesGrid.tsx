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
    title: "100% local & keyless",
    number: "No. 1",
    icon: ShieldIcon,
  },
  {
    id: "f2",
    title: "zero-latency hide",
    number: "No. 2",
    icon: GaugeIcon,
  },
  {
    id: "f3",
    title: "tri-agent support",
    number: "No. 3",
    icon: PlugIcon,
  },
  {
    id: "f4",
    title: "pure tech radar",
    number: "No. 4",
    icon: RadarIcon,
  },
  {
    id: "f5",
    title: "36h persistent pool",
    number: "No. 5",
    icon: BranchIcon,
  },
  {
    id: "f6",
    title: "honest limits contract",
    number: "No. 6",
    icon: BrainIcon,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
            <span className="font-decima text-[10px] uppercase tracking-widest text-[#fcaa2d]">
              Features
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918] max-w-180">
            Engineered for{" "}
            <strong className="font-display font-normal text-black">terminal focus</strong>
          </h2>
          <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
            Zero ads, zero accounts, zero cloud backends. A local-first developer intelligence layer built specifically for the latency windows of autonomous coding agents.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group p-6 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/60 hover:bg-[#f3f2e7] hover:border-[#191918]/20 flex flex-col justify-between min-h-36 sm:min-h-40 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#191918] group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-decima text-base uppercase tracking-wider text-[#191918]">
                    {feat.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-decima text-[10px] uppercase tracking-widest text-[#191918]/50">
                    {feat.number}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
