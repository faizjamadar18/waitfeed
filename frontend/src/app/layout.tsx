import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "WaitFeed — Real-Time Developer Intelligence for OpenCode, AGY & Claude Code",
  description:
    "While your AI coding agent works, a slim tech feed rotates developer updates and trending repos in your terminal. You start typing — it vanishes. 100% local, no ads, zero keys.",
  icons: {
    icon: [
      {
        url: "https://framerusercontent.com/images/FFActUeE4daoS9F9mpqmKv4y3ZI.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "https://framerusercontent.com/images/tsBoPWRI49fIIsApJWW1xqPCgj0.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    type: "website",
    title: "WaitFeed — Real-Time Developer Intelligence for OpenCode, AGY & Claude Code",
    description:
      "While your AI coding agent works, a slim tech feed rotates developer updates and trending repos in your terminal. You start typing — it vanishes. 100% local, no ads, zero keys.",
    url: "https://waitfeed.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "WaitFeed — Real-Time Developer Intelligence for OpenCode, AGY & Claude Code",
    description:
      "While your AI coding agent works, a slim tech feed rotates developer updates and trending repos in your terminal. You start typing — it vanishes. 100% local, no ads, zero keys.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-parabole bg-[#fffef2] text-[#191918] antialiased min-h-screen selection:bg-[#fcaa2d] selection:text-white">
        {children}
        <Script
          src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
          type="module"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
