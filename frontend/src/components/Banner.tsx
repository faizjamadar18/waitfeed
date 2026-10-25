import Link from "next/link";

export function Banner() {
  return (
    <aside
      aria-label="Announcement"
      className="fixed top-0 left-0 right-0 z-50 h-10 bg-[#fcaa2d] flex items-center justify-center px-4 text-[#191918] font-parabole text-xs tracking-tight select-none"
    >
      <div className="flex items-center gap-1.5 text-center">
        <span className="hidden sm:inline">
          Jacq is now available on macOS. Download and try it for free at
        </span>
        <span className="inline sm:hidden">
          Try Jacq for free at
        </span>
        <Link
          href="https://jacquard.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          jacquard.dev
        </Link>
      </div>
    </aside>
  );
}
