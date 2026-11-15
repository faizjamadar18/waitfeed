import type { Metadata } from "next";
import { VercelDocsLayout } from "@/components/docs/VercelDocsLayout";

export const metadata: Metadata = {
  title: "WaitFeed Documentation — Real-time Tech Feeds for AI Coding Agents",
  description:
    "Complete developer guide, zero-token architecture, CLI reference, and host adapter documentation for WaitFeed across OpenCode, Claude Code, and Antigravity.",
};

export default function DocsPage() {
  return <VercelDocsLayout />;
}
