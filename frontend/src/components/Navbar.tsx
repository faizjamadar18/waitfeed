"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RelaceLogo, HamburgerIcon, CloseIcon } from "./Icons";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className="fixed top-10 left-0 right-0 z-40 h-16 bg-[#fffef2]/95 backdrop-blur-md border-b border-[#e3e2d8]/60 transition-colors">
      <div className="max-w-266 mx-auto px-5 sm:px-10 h-full flex items-center justify-between">
        {/* Left: Logo & Nav items */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            aria-label="Relace home"
            className="flex items-center text-[#191918] hover:opacity-80 transition-opacity"
          >
            <RelaceLogo className="w-6 h-6 text-[#191918]" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#191918]/60 font-parabole">
            <Link
              href="https://docs.relace.ai/docs/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191918] transition-colors"
            >
              docs
            </Link>
            <Link
              href="/blog"
              className="hover:text-[#191918] transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              className="hover:text-[#191918] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about-us"
              className="hover:text-[#191918] transition-colors"
            >
              about us
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link
            href="https://app.relace.ai/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-3.5 py-1.5 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7]/80 hover:bg-[#f3f2e7] text-[#191918] transition-colors"
          >
            app
          </Link>
          <Link
            href="https://cal.com/team/relace/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-3.5 py-1.5 rounded-xs bg-[#191918] text-white hover:bg-[#2c2c2a] transition-colors"
          >
            Get a Demo
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="p-2 text-[#191918] hover:opacity-75 transition-opacity"
          >
            {isOpen ? <CloseIcon className="w-4 h-4" /> : <HamburgerIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#fffef2] border-b border-[#e3e2d8] px-6 py-8 shadow-lg flex flex-col gap-6">
          <nav className="flex flex-col gap-4 text-base font-parabole text-[#191918]">
            <Link
              href="https://docs.relace.ai/docs/introduction"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="text-[#191918]/70 hover:text-[#191918] transition-colors"
            >
              docs
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsOpen(false)}
              className="text-[#191918]/70 hover:text-[#191918] transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="text-[#191918]/70 hover:text-[#191918] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about-us"
              onClick={() => setIsOpen(false)}
              className="text-[#191918]/70 hover:text-[#191918] transition-colors"
            >
              about us
            </Link>
          </nav>
          <div className="flex flex-col gap-2.5 pt-4 border-t border-[#e3e2d8]">
            <Link
              href="https://app.relace.ai/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs font-medium py-2 rounded-xs border border-[#e3e2d8] bg-[#f3f2e7] text-[#191918]"
            >
              app
            </Link>
            <Link
              href="https://cal.com/team/relace/30min"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs font-medium py-2 rounded-xs bg-[#191918] text-white"
            >
              Get a Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
