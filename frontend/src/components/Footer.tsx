import Link from "next/link";
import { RelaceLogo, TwitterIcon } from "./Icons";
import { CtaButton } from "./CtaButton";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#e3e2d8] bg-[#fffef2] pt-10 pb-14 text-xs font-parabole">
      <div className="max-w-266 mx-auto px-5 sm:px-10 flex flex-col gap-8">
        {/* Top row: Brand Logo, Main Links & Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#191918]/10">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-[#191918]">
            <Link
              href="/"
              aria-label="WaitFeed home"
              className="mr-2 flex items-center text-[#191918] hover:opacity-80 transition-opacity"
            >
              <RelaceLogo className="h-5 w-auto text-[#191918]" />
            </Link>

            <CtaButton
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              variant="ghost"
            >
              github
            </CtaButton>
            <CtaButton
              href="https://www.npmjs.com/package/waitfeed"
              target="_blank"
              variant="ghost"
            >
              npm package
            </CtaButton>
            <CtaButton
              href="https://github.com/faizjamadar18/waitfeed/blob/main/LICENSE"
              target="_blank"
              variant="ghost"
            >
              mit license
            </CtaButton>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="w-8 h-8 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] flex items-center justify-center text-[#191918] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </Link>
            <Link
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="w-8 h-8 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] flex items-center justify-center text-[#191918] transition-colors"
            >
              <TwitterIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom row: Copyright & Legal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] sm:text-[11px] text-[#191918]/60 font-decima uppercase tracking-wider">
          <div>
            Copyright © 2026 WaitFeed. 100% Local &amp; Open-Source.
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="https://opencode.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              OpenCode
            </Link>
            <Link
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              AGY Integration
            </Link>
            <Link
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              Claude Code
            </Link>
            <Link
              href="https://github.com/faizjamadar18/waitfeed/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              MIT License
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
