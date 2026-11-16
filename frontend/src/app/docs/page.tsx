import type { Metadata } from "next";
import { VercelDocsLayout } from "@/components/docs/VercelDocsLayout";

export const metadata: Metadata = {
  title: "WaitFeed Documentation — A News Ticker for AI Coding Agents",
  description:
    "Install and configure WaitFeed for Claude Code, OpenCode, and Antigravity. Shared local cache, four built-in channels, custom RSS, and a zero-key pipeline.",
};

export default function DocsPage() {
  return <VercelDocsLayout />;
}
