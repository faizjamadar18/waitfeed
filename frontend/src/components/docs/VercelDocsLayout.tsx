"use client";

import { useState, useEffect } from "react";
import { VercelDocsHeader } from "./VercelDocsHeader";
import { VercelDocsSidebar } from "./VercelDocsSidebar";
import { VercelDocsTOC } from "./VercelDocsTOC";
import { VercelDocsSearchModal } from "./VercelDocsSearchModal";
import { DocsPageContent } from "./DocsPageContent";
import { DOCS_SECTION_IDS } from "@/data/docsData";

export function VercelDocsLayout() {
  const [activeSectionId, setActiveSectionId] = useState("overview");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scrollspy observer
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerOffset = 140;

      for (let i = DOCS_SECTION_IDS.length - 1; i >= 0; i--) {
        const id = DOCS_SECTION_IDS[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY - headerOffset;
          if (scrollY >= top) {
            setActiveSectionId(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="docs-root min-h-screen bg-black text-[#ededed] flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Docs Header */}
      <VercelDocsHeader
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main Container: 3-column Vercel layout */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex items-start">
        {/* Left Sticky Sidebar */}
        <VercelDocsSidebar
          activeSectionId={activeSectionId}
          onSelectSection={handleSelectSection}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Canvas */}
        <main className="flex-1 min-w-0 pb-20">
          <DocsPageContent onSelectSection={handleSelectSection} />
        </main>

        {/* Right Sticky TOC */}
        <VercelDocsTOC
          activeSectionId={activeSectionId}
          onSelectSection={handleSelectSection}
        />
      </div>

      {/* Search Modal (Cmd+K) */}
      <VercelDocsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSection={handleSelectSection}
      />
    </div>
  );
}
