import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WaitFeed — The ambient developer news ticker for OpenCode",
  description:
    "While your OpenCode agent works, a slim news ticker appears above the input box. You start typing — it vanishes. 100% local, no ads, no accounts, no server, no API keys.",
  keywords: [
    "opencode plugin",
    "terminal news ticker",
    "developer news",
    "ai agent idle time",
    "ambient terminal feeds",
    "waitfeed",
    "open source developer tools",
  ],
  authors: [{ name: "Faiz Jamadar", url: "https://github.com/faizjamadar18" }],
  creator: "Faiz Jamadar",
  openGraph: {
    title: "WaitFeed — The ambient developer news ticker for OpenCode",
    description:
      "While your agent works, a slim news ticker appears above your input box. Start typing, it vanishes. 100% local, zero ads, zero tracking, zero API keys.",
    url: "https://github.com/faizjamadar18/waitfeed",
    siteName: "WaitFeed",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WaitFeed — The ambient developer news ticker for OpenCode",
    description:
      "While your agent works, a slim news ticker appears above your input box. Start typing, it vanishes. 100% local, zero ads, zero tracking, zero API keys.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="font-body bg-(--bg-primary) text-(--ink-primary) antialiased min-h-screen selection:bg-(--accent-color) selection:text-black">
        {children}
      </body>
    </html>
  );
}
