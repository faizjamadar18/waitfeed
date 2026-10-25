import Image from "next/image";

interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  tag: string;
  avatar: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "systems-dev",
    quote:
      "Agent wait times used to be dead latency or an excuse to switch tabs and lose context. WaitFeed turns those 20 seconds into a high-signal tech briefing without ever leaving my terminal.",
    name: "Alex Rivera",
    role: "Staff Systems Engineer · Open Source Contributor",
    tag: "TERMINAL FLOW",
    avatar:
      "https://framerusercontent.com/images/Mw2cnIpdnUoEW60Ce79wqgu414.png?width=192&height=192",
  },
  {
    id: "infra-dev",
    quote:
      "Every other wait-time project is trying to build an ad exchange or track developer queries. WaitFeed keeping everything 100% local with zero tracking and zero API keys is exactly how CLI tools should be built.",
    name: "Elena Rostova",
    role: "Principal Infrastructure Architect",
    tag: "ANTI-AD & LOCAL-FIRST",
    avatar:
      "https://framerusercontent.com/images/0QooaWnldML3OowpdLQ9ZHkeKhE.png?width=192&height=192",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="w-full py-16 sm:py-24 border-t border-[#e3e2d8]">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fcaa2d]" />
            <span className="font-decima text-[10px] uppercase tracking-widest text-[#fcaa2d]">
              Perspective
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.1] tracking-[-0.04em] text-[#191918]">
            Built for{" "}
            <strong className="font-display font-normal text-black">terminal purists</strong>
          </h2>
        </div>

        {/* 2 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="relative p-8 sm:p-10 rounded-xs border border-[#e3e2d8] bg-[#d1d0c6]/40 flex flex-col justify-between gap-8 min-h-75 overflow-hidden"
            >
              {/* Noise texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20 bg-repeat select-none"
                style={{
                  backgroundImage:
                    "url(https://framerusercontent.com/images/T6GZgUBLVuKByhKl5821T4EQh0.png?width=432&height=288)",
                  backgroundSize: "432px auto",
                }}
              />

              {/* Tag & Quote */}
              <div className="relative z-10 flex flex-col gap-6">
                <div>
                  <span className="font-decima text-[10px] uppercase tracking-wider text-[#191918]/70 bg-[#191918]/5 px-2.5 py-1 rounded-xs border border-[#191918]/10 inline-block">
                    {item.tag}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-[#191918] font-parabole leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author info */}
              <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-[#191918]/10">
                <Image
                  src={item.avatar}
                  alt={item.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover select-none border border-[#e3e2d8]"
                  unoptimized
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#191918] font-parabole">
                    {item.name}
                  </span>
                  <span className="text-xs text-[#191918]/60 font-parabole">
                    {item.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
