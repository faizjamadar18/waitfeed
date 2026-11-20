import Image from "next/image";

/**
 * Official Product Hunt "featured" badge.
 *
 * Kept as the shipped embed (their SVG, their mark, their alt text) so the
 * asset and upvote link stay authoritative; only the framing is local — a
 * keyboard focus ring and, via `next/image` with `unoptimized`, real 250x54
 * dimensions so the hero reserves the space instead of shifting on load.
 * Those dimensions hold the aspect ratio only; the rendered width is fluid
 * (`clamp`), so the badge scales with the viewport instead of pinning one size.
 */
export function ProductHuntBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://www.producthunt.com/products/waitfeed-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-waitfeed-2"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block w-fit rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191918]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffef2] ${className}`}
    >
      <Image
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1324672&theme=light&t=1795206029503"
        alt="WaitFeed - Tech feed inside agent wait time | Product Hunt"
        width={250}
        height={54}
        unoptimized
        className="h-auto w-[clamp(150px,18vw,210px)] max-w-full select-none"
      />
    </a>
  );
}
