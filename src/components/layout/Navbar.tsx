"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 mx-auto z-50 rounded-lg border-2 border-white bg-[#f6f6f6]/50 px-6 py-1 shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-[top,width] duration-300 ease-out ${
        scrolled ? "top-3 w-[88%] md:w-[56%]" : "top-5 w-[92%] md:w-[64%]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 md:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white">
            <img src="/8442672.svg" className="bg-transparent" alt="SafeRide logo"></img>
          </div>
          <span className={`font-bold tracking-tight text-foreground transition-[font-size] duration-300 ${scrolled ? "text-base lg:text-lg" : "text-lg"}`}>
            SafeRide
          </span>
        </Link>

        <div className={`hidden min-w-0 flex-1 items-center justify-center md:flex ${scrolled ? "gap-2 lg:gap-3" : "gap-3 lg:gap-5"}`}>
          <a
            href="#why"
            aria-label="Why SafeRide"
            className={`whitespace-nowrap font-medium text-(--text-2) border-transparent hover:border-white hover:bg-[#efefed]/70 hover:text-[#171411] hover:shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] rounded-md transition-all duration-300 ${
              scrolled ? "px-1.5 py-1 text-xs lg:text-sm" : "px-2 py-1 text-sm"
            }`}
          >
            <span className="lg:hidden">Why</span>
            <span className="hidden lg:inline">Why SafeRide</span>
          </a>
          <a
            href="#features"
            className={`whitespace-nowrap font-medium text-(--text-2) border-transparent hover:border-white hover:bg-[#efefed]/70 hover:text-[#171411] hover:shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] rounded-md transition-all duration-300 ${
              scrolled ? "px-1.5 py-1 text-xs lg:text-sm" : "px-2 py-1 text-sm"
            }`}
          >
            Features
          </a>
          <a
            href="#safety"
            className={`whitespace-nowrap font-medium text-(--text-2) border-transparent hover:border-white hover:bg-[#efefed]/70 hover:text-[#171411] hover:shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] rounded-md transition-all duration-300 ${
              scrolled ? "px-1.5 py-1 text-xs lg:text-sm" : "px-2 py-1 text-sm"
            }`}
          >
            Safety
          </a>
          <a
            href="#app-preview"
            aria-label="App Preview"
            className={`whitespace-nowrap font-medium text-(--text-2) border-transparent hover:border-white hover:bg-[#efefed]/70 hover:text-[#171411] hover:shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] rounded-md transition-all duration-300 ${
              scrolled ? "px-1.5 py-1 text-xs lg:text-sm" : "px-2 py-1 text-sm"
            }`}
          >
            <span className="lg:hidden">Preview</span>
            <span className="hidden lg:inline">App Preview</span>
          </a>
        </div>

        <div className={`hidden shrink-0 items-center md:flex ${scrolled ? "gap-2" : "gap-3"}`}>
          <Link href="/login">
            <Button variant="secondary" className={`text-xs transition-all duration-300 ${scrolled ? "px-3 py-2" : "px-4 py-2.5"}`}>
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" className={`transition-all duration-300 ${scrolled ? "px-4 py-2" : "px-5 py-2.5"}`}>
              <span className="lg:hidden">Join</span>
              <span className="hidden lg:inline">Join Now</span>
            </Button>
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-(--border) bg-white text-foreground hover:border-(--primary)/25 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </>
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-(--border) bg-white md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            <a
              href="#why"
              className="rounded-lg px-3 py-2 text-sm text-(--text-2) hover:bg-(--bg-muted)"
              onClick={() => setMobileOpen(false)}
            >
              Why SafeRide
            </a>
            <a
              href="#features"
              className="rounded-lg px-3 py-2 text-sm text-(--text-2) hover:bg-(--bg-muted)"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </a>
            <a
              href="#safety"
              className="rounded-lg px-3 py-2 text-sm text-(--text-2) hover:bg-(--bg-muted)"
              onClick={() => setMobileOpen(false)}
            >
              Safety
            </a>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/login">
                <Button variant="secondary" fullWidth>
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" fullWidth>
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
