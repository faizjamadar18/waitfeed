import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocsPageContent } from "@/components/docs/DocsPageContent";

export const metadata: Metadata = {
  title: "Docs — WaitFeed",
  description:
    "Simple, step-by-step guide to installing and using WaitFeed with OpenCode, Claude Code, and Google Antigravity.",
};

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fffef2] text-[#191918]">
      <Navbar />
      <div className="flex-1">
        <DocsPageContent />
      </div>
      <Footer />
    </div>
  );
}

