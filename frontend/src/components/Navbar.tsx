"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RelaceLogo, HamburgerIcon, CloseIcon } from "./Icons";
import { CtaButton } from "./CtaButton";

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
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#fffef2]/95 backdrop-blur-md transition-colors">
      <div className="max-w-266 mx-auto px-5 sm:px-10 h-full flex items-center justify-between">
        {/* Left: Logo & Nav items */}
        <div className="flex items-center gap-8 sm:gap-10">
          <Link
            href="/"
            aria-label="WaitFeed home"
            className="flex items-center text-[#191918] hover:opacity-80 transition-opacity"
          >
            <RelaceLogo className="h-6 w-auto text-[#191918]" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs text-[#191918] font-parabole tracking-wider uppercase">
            <Link
              href="#how-it-works"
              className="relative py-1 text-[#191918] hover:text-[#191918] transition-colors group"
            >
              HOW IT WORKS
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[#191918] transition-all duration-200 group-hover:w-full" />
            </Link>
            <Link
              href="#sources"
              className="relative py-1 text-[#191918] hover:text-[#191918] transition-colors group"
            >
              TECH SOURCES
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[#191918] transition-all duration-200 group-hover:w-full" />
            </Link>
            <Link
              href="#features"
              className="relative py-1 text-[#191918] hover:text-[#191918] transition-colors group"
            >
              FEATURES
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[#191918] transition-all duration-200 group-hover:w-full" />
            </Link>
            <Link
              href="#faq"
              className="relative py-1 text-[#191918] hover:text-[#191918] transition-colors group"
            >
              FAQS
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[#191918] transition-all duration-200 group-hover:w-full" />
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="https://github.com/faizjamadar18/waitfeed"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 text-xs font-parabole font-medium text-[#191918] uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            GITHUB
          </Link>
          <CtaButton
            href="#install"
            variant="accent"
            showArrow={false}
            className="py-1.5! px-3.5! text-xs! font-medium! uppercase tracking-wider text-[#191918]!"
          >
            INSTALL CLI
          </CtaButton>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="p-2 text-[#191918] hover:opacity-75 transition-opacity cursor-pointer"
          >
            {isOpen ? <CloseIcon className="w-5 h-5" /> : <HamburgerIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-[#fffef2] border-b border-[#e3e2d8] px-6 py-8 shadow-lg flex flex-col gap-6">
          <nav className="flex flex-col gap-4 text-xs font-parabole text-[#191918] tracking-wider uppercase">
            <Link
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-[#191918] hover:opacity-80 transition-opacity"
            >
              HOW IT WORKS
            </Link>
            <Link
              href="#sources"
              onClick={() => setIsOpen(false)}
              className="text-[#191918] hover:opacity-80 transition-opacity"
            >
              TECH SOURCES
            </Link>
            <Link
              href="#features"
              onClick={() => setIsOpen(false)}
              className="text-[#191918] hover:opacity-80 transition-opacity"
            >
              FEATURES
            </Link>
            <Link
              href="#faq"
              onClick={() => setIsOpen(false)}
              className="text-[#191918] hover:opacity-80 transition-opacity"
            >
              FAQS
            </Link>
          </nav>
          <div className="flex flex-col gap-2.5 pt-4 border-t border-[#e3e2d8]">
            <CtaButton
              href="https://github.com/faizjamadar18/waitfeed"
              target="_blank"
              variant="beige"
              showArrow={false}
              onClick={() => setIsOpen(false)}
              className="w-full text-center uppercase tracking-wider text-xs py-2.5!"
            >
              GITHUB
            </CtaButton>
            <CtaButton
              href="#install"
              variant="accent"
              showArrow={false}
              onClick={() => setIsOpen(false)}
              className="w-full text-center uppercase tracking-wider text-xs py-2.5!"
            >
              INSTALL CLI
            </CtaButton>
          </div>
        </div>
      )}
    </header>
  );
}
