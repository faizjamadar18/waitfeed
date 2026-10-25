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
    title: "specialized models",
    number: "No. 1",
    icon: BrainIcon,
  },
  {
    id: "f2",
    title: "fast retrieval",
    number: "No. 2",
    icon: RadarIcon,
  },
  {
    id: "f3",
    title: "Source COntrol",
    number: "No. 3",
    icon: BranchIcon,
  },
  {
    id: "f4",
    title: "low latency",
    number: "No. 4",
    icon: GaugeIcon,
  },
  {
    id: "f5",
    title: "simple integration",
    number: "No. 5",
    icon: PlugIcon,
  },
  {
    id: "f6",
    title: "built for reliability",
    number: "No. 6",
    icon: ShieldIcon,
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
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.15] tracking-[-0.04em] text-[#191918] max-w-175">
            Building blocks for{" "}
            <strong className="font-display font-bold">reliability and scale</strong>
          </h2>
          <p className="text-sm sm:text-base text-[#191918]/60 font-parabole leading-relaxed max-w-160">
            Source control with out-of-the box codebase retrieval, fast utility SLMs, and task-specific agents you can run on any repo.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group p-6 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/60 hover:bg-[#f3f2e7] hover:border-[#191918]/20 flex flex-col justify-between min-h-35 sm:min-h-40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#191918] group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-decima text-sm uppercase tracking-wide text-[#191918]">
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
