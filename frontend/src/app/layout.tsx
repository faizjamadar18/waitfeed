import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relace (previous site)",
  description:
    "Relace delivers purpose-built AI models and scalable infrastructure for coding agents, offering ultra-fast code retrieval, merging, and autonomous workflows. Cut down errors and accelerate development with Relace.",
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
    title: "Relace (previous site)",
    description:
      "Relace delivers purpose-built AI models and scalable infrastructure for coding agents, offering ultra-fast code retrieval, merging, and autonomous workflows. Cut down errors and accelerate development with Relace.",
    url: "https://relace.ai/old",
    images: [
      {
        url: "https://framerusercontent.com/images/D6XFBAXygf3ZHyjrXSmLmItnPI.png",
        width: 1200,
        height: 630,
        alt: "Relace preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Relace (previous site)",
    description:
      "Relace delivers purpose-built AI models and scalable infrastructure for coding agents, offering ultra-fast code retrieval, merging, and autonomous workflows. Cut down errors and accelerate development with Relace.",
    images: ["https://framerusercontent.com/images/D6XFBAXygf3ZHyjrXSmLmItnPI.png"],
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
      </body>
    </html>
  );
}
