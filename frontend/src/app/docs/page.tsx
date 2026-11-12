import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocsPageContent } from "@/components/docs/DocsPageContent";

export const metadata: Metadata = {
  title: "Documentation — WaitFeed",
  description:
    "Complete technical reference for WaitFeed: shared cache pipeline, keyless feed ingestion, CLI wizard, and OpenCode, Claude Code, and Google Antigravity adapters.",
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

