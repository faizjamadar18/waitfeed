import Link from "next/link";
import { TwitterIcon, LinkedInIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#e3e2d8] bg-[#fffef2] pt-10 pb-14 text-xs font-parabole">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-8">
        {/* Top row: Main Links & Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#191918]/10">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-[#191918]">
            <Link
              href="https://www.ycombinator.com/companies/relace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] text-[#191918] transition-colors"
            >
              y combinator
            </Link>
            <Link
              href="/about-us"
              className="text-xs font-medium px-3 py-1.5 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] text-[#191918] transition-colors"
            >
              about us
            </Link>
            <Link
              href="mailto:info@relace.ai"
              className="text-xs font-medium px-3 py-1.5 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] text-[#191918] transition-colors"
            >
              email us
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="https://x.com/relace_ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="w-8 h-8 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] flex items-center justify-center text-[#191918] transition-colors"
            >
              <TwitterIcon className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="https://www.linkedin.com/company/relace-ai/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-8 h-8 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] flex items-center justify-center text-[#191918] transition-colors"
            >
              <LinkedInIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom row: Copyright & Legal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] sm:text-[11px] text-[#191918]/60 font-decima uppercase tracking-wider">
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
