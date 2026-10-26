import Link from "next/link";
import { RelaceEmblem, TwitterIcon, LinkedInIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="w-full bg-[#fffef2] pt-0 pb-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-266 flex flex-col">
        {/* Footer Top Row: Logo, Links (Y Combinator, About Us, Email Us), Socials (X, LinkedIn) (matches Relace #framer-3uejix) */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-5 py-5">
          {/* Left: Logo */}
          <Link
            href="/"
            aria-label="Relace Home"
            className="flex items-center gap-2.5 text-[#191918] hover:opacity-85 transition-opacity"
          >
            <RelaceEmblem className="w-6 h-6 text-[#191918]" />
            <span className="font-parabole text-xl font-medium tracking-tight text-[#191918]">
              Relace
            </span>
          </Link>

          {/* Middle: Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link
              href="https://www.ycombinator.com/companies/relace"
              target="_blank"
              rel="noopener noreferrer"
              className="font-parabole text-xs font-normal uppercase tracking-[0.04em] text-[#191918] hover:text-black transition-colors"
            >
              Y Combinator
            </Link>
            <Link
              href="/about-us"
              className="font-parabole text-xs font-normal uppercase tracking-[0.04em] text-[#191918] hover:text-black transition-colors"
            >
              About Us
            </Link>
            <Link
              href="mailto:info@relace.ai"
              className="font-parabole text-xs font-normal uppercase tracking-[0.04em] text-[#191918] hover:text-black transition-colors"
            >
              Email Us
            </Link>
          </div>

          {/* Right: Socials (X, LinkedIn) */}
          <div className="flex items-center gap-4">
            <Link
              href="https://x.com/relace_ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="text-[#191918] hover:opacity-70 transition-opacity"
            >
              <TwitterIcon className="w-4 h-4" />
            </Link>
            <Link
              href="https://www.linkedin.com/company/relace-ai/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-[#191918] hover:opacity-70 transition-opacity"
            >
              <LinkedInIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1px Divider Line (matches Relace #framer-49p5hk) */}
        <div className="w-full h-px bg-[#191918]/5 mx-auto" />

        {/* Footer Bottom Row: Copyright on Left, Legal on Right (matches Relace #framer-129z12s) */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-5 text-[10px] text-[#191918]/60 font-parabole">
          <div>
            Copyright © 2026 Relace
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="https://status.relace.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              Status
            </Link>
            <Link
              href="/legal/terms-of-use"
              className="hover:text-[#191918] transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              href="/legal/privacy-policy"
              className="hover:text-[#191918] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/zero-data-retention-policy"
              className="hover:text-[#191918] transition-colors"
            >
              ZDR Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
