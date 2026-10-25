import Link from "next/link";

export function Banner() {
  return (
    <aside
      aria-label="Announcement"
      className="fixed top-0 left-0 right-0 z-50 h-10 bg-[#fcaa2d] flex items-center justify-center px-4 text-[#191918] font-parabole text-xs tracking-tight select-none border-b border-[#191918]/10"
    >
      <div className="flex items-center gap-1.5 text-center">
        <span className="hidden sm:inline">
          WaitFeed is live across OpenCode &amp; AGY — Claude Code integration is now ready. Real-time tech briefs in your terminal.
        </span>
        <span className="inline sm:hidden">
          WaitFeed is live for OpenCode, AGY &amp; Claude Code.
        </span>
        <Link
          href="#how-it-works"
          className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Learn more →
        </Link>
      </div>
    </aside>
  );
}
