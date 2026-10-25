import Image from "next/image";

interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "teddy-ni",
    quote:
      "Relace has been a critical tool for us to create custom, design-focused AI models and allowed us to fine tune on our own data and continuously create better and better models.",
    name: "Teddy Ni",
    role: "Co-Founder at magic patterns",
    avatar:
      "https://framerusercontent.com/images/Mw2cnIpdnUoEW60Ce79wqgu414.png?width=192&height=192",
    logo: "https://framerusercontent.com/images/K7SPlhJqoaWF6f54wsEJzpesBo.svg?width=155&height=24",
    logoWidth: 155,
    logoHeight: 24,
  },
  {
    id: "james-grugett",
    quote:
      "Just wanted to say that Relace’s fast rewriting model has been a big boon to our product. It’s made edits more reliable with hardly any visible downsides. A whole class of bugs is gone for us now.",
    name: "James Grugett",
    role: "Co-Founder & ceo at codebuff",
    avatar:
      "https://framerusercontent.com/images/0QooaWnldML3OowpdLQ9ZHkeKhE.png?width=192&height=192",
    logo: "https://framerusercontent.com/images/3ExnUwdijE217iE33wOFOzPZyp0.svg?width=127&height=29",
    logoWidth: 127,
    logoHeight: 29,
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
              Testimonials
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-parabole font-normal leading-[1.15] tracking-[-0.04em] text-[#191918]">
            Trusted by{" "}
            <strong className="font-display font-bold">trailblazers</strong>
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
                className="absolute inset-0 pointer-events-none opacity-20 bg-repeat"
                style={{
                  backgroundImage:
                    "url(https://framerusercontent.com/images/T6GZgUBLVuKByhKl5821T4EQh0.png?width=432&height=288)",
                  backgroundSize: "432px auto",
                }}
              />

              {/* Logo & Quote */}
              <div className="relative z-10 flex flex-col gap-6">
                <div className="opacity-60 h-6 flex items-center">
                  <Image
                    src={item.logo}
                    alt=""
                    width={item.logoWidth}
                    height={item.logoHeight}
                    className="h-6 w-auto object-contain select-none"
                    unoptimized
                  />
                </div>

                <p className="text-sm sm:text-base text-[#191918] font-parabole leading-relaxed">
                  {item.quote}
                </p>
              </div>

              {/* Author */}
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
