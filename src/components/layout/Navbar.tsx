"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 border-b border-(--border) transition-colors ${
        scrolled ? "bg-white/85 backdrop-blur-xl" : "bg-white/70 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-(--primary) text-sm font-bold text-white">
            S
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">SafeRide</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#why"
            className="text-sm font-medium text-(--text-2) hover:text-foreground"
          >
            Why SafeRide
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-(--text-2) hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#safety"
            className="text-sm font-medium text-(--text-2) hover:text-foreground"
          >
            Safety
          </a>
          <a
            href="#app-preview"
            className="text-sm font-medium text-(--text-2) hover:text-foreground"
          >
            App Preview
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="secondary" className="px-4 py-2.5 text-xs">Log in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" className="px-5 py-2.5">Join Now</Button>
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
