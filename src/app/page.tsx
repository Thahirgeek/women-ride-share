"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ColorBends from "@/components/ColorBends";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-transparent">
      <div className="fixed inset-0 -z-10 h-full w-full pointer-events-none">
        <ColorBends
          rotation={45}
          speed={0.15}
          colors={["#5227FF", "#9efdff", "#4c00ff"]}
          transparent
          autoRotate={0.5}
          scale={1.3}
          frequency={1}
          warpStrength={1}
          mouseInfluence={0.2}
          parallax={0.5}
          noise={0.1}
        />
      </div>
      <Navbar />

      <section className="px-6 pb-20 pt-32 sm:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="pill animate-fade-up inline-flex px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
              The Frictionless Concierge
            </span>
            <h1 className="animate-fade-up delay-100 mt-5 text-4xl font-[inter-semibold] leading-tight tracking-tighter text-foreground sm:text-5xl lg:text-7xl">
              The New Era of
              <br />
              Safe Rides for <span className="font-[instrumentserif-italic] text-8xl">Women</span>
            </h1>
            <p className="animate-fade-up delay-200 mt-5 max-w-xl text-base text-(--text-2) sm:text-lg">
              SafeRide pairs every booking with verified drivers, transparent ride composition,
              and clean in-app workflows built for confidence at every step.
            </p>

            <div className="animate-fade-up delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button className="px-6 py-3 text-sm">Join Now</Button>
              </Link>
              <Link href="/passenger/search">
                <Button variant="secondary" className="px-6 py-3 text-sm">Explore Rides</Button>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-(--text-3)">
              <span>Verified Drivers</span>
              <span className="h-1 w-1 rounded-full bg-(--text-3)" />
              <span>Safety Filters</span>
              <span className="h-1 w-1 rounded-full bg-(--text-3)" />
              <span>Live Booking Status</span>
            </div>
          </div>

          <div className="animate-fade-up delay-200 relative">
            <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-(--primary)/15 blur-2xl" />
            <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-sky-100 blur-xl" />
            <Card className="relative overflow-hidden border-(--primary)/15">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-(--text-3)">Upcoming Ride</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">Indiranagar to HSR Layout</h3>
                </div>
                <span className="rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-semibold text-(--primary)">
                  Ladies Preferred
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-(--border) bg-(--bg-muted) p-3">
                  <p className="text-xs text-(--text-3)">Driver</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Ananya R.</p>
                </div>
                <div className="rounded-lg border border-(--border) bg-(--bg-muted) p-3">
                  <p className="text-xs text-(--text-3)">Departure</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">7:30 PM</p>
                </div>
                <div className="rounded-lg border border-(--border) bg-(--bg-muted) p-3">
                  <p className="text-xs text-(--text-3)">Seats</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">2 left</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-(--border) pt-4">
                <p className="text-sm text-(--text-2)">Secure fare</p>
                <p className="text-xl font-bold text-foreground">Rs 140</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-(--border) px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 text-sm font-medium text-(--text-2) sm:gap-12">
          <span>Trusted by verified commuters</span>
          <span className="h-1 w-1 rounded-full bg-(--text-3)" />
          <span>Integrated safety onboarding</span>
          <span className="h-1 w-1 rounded-full bg-(--text-3)" />
          <span>Built for women-first comfort</span>
        </div>
      </section>

      <section id="why" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-(--primary)">Why SafeRide</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              Designed like a concierge, not a chaotic marketplace.
            </h2>
            <p className="mt-3 text-(--text-2)">
              Every surface focuses on speed, clarity, and trust so passengers can decide quickly and travel safely.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--primary-soft) text-(--primary)">
                OK
              </div>
              <h3 className="text-lg font-semibold text-foreground">Identity-Checked Drivers</h3>
              <p className="mt-2 text-sm text-(--text-2)">Strict onboarding and verification before rides go live.</p>
            </Card>
            <Card>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--primary-soft) text-(--primary)">
                Fast
              </div>
              <h3 className="text-lg font-semibold text-foreground">Fast Decision UX</h3>
              <p className="mt-2 text-sm text-(--text-2)">Critical ride details are visible upfront for faster, safer booking.</p>
            </Card>
            <Card>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-(--primary-soft) text-(--primary)">
                Safe
              </div>
              <h3 className="text-lg font-semibold text-foreground">Women-First Controls</h3>
              <p className="mt-2 text-sm text-(--text-2)">Use safety filters and composition signals before confirming.</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" className="section-muted border-y border-(--border) px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Feature Highlights</h2>
          <p className="mt-3 max-w-2xl text-(--text-2)">
            A clean card-first architecture inspired by high-performance SaaS experiences.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="animate-fade-up">
              <h3 className="text-lg font-semibold text-foreground">Composition Visibility</h3>
              <p className="mt-2 text-sm text-(--text-2)">Preview current passenger mix before choosing your ride.</p>
            </Card>
            <Card className="animate-fade-up delay-100">
              <h3 className="text-lg font-semibold text-foreground">Live Booking States</h3>
              <p className="mt-2 text-sm text-(--text-2)">Track pending, confirmed, and completed rides in one flow.</p>
            </Card>
            <Card className="animate-fade-up delay-200">
              <h3 className="text-lg font-semibold text-foreground">Driver Availability Controls</h3>
              <p className="mt-2 text-sm text-(--text-2)">Drivers can instantly set online status and composition mode.</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="safety" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Safety, Compared</h2>
          <p className="mt-3 max-w-2xl text-(--text-2)">The difference between manual coordination and SafeRide operations.</p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="border-red-100 bg-red-50/70">
              <p className="text-sm font-semibold text-red-700">Manual Ride Coordination</p>
              <ul className="mt-4 space-y-3 text-sm text-red-900/85">
                <li>Unclear passenger composition before pickup.</li>
                <li>No consistent verification trail.</li>
                <li>Scattered messages and uncertain status updates.</li>
              </ul>
            </Card>

            <Card className="border-(--primary)/15 bg-(--primary-soft)/35">
              <p className="text-sm font-semibold text-(--primary)">With SafeRide</p>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                <li>Composition-aware booking before confirmation.</li>
                <li>Structured driver onboarding and verification.</li>
                <li>Single source of truth for booking status and actions.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section id="app-preview" className="section-muted border-y border-(--border) px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-(--primary)">Mobile Preview</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              A calm, secure app experience in your pocket.
            </h2>
            <p className="mt-3 text-(--text-2)">
              Search rides, apply safety filters, and confirm bookings with a touch-first interface built for confidence.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button className="px-6 py-3">Create Free Account</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="px-6 py-3">Sign In</Button>
              </Link>
            </div>
          </div>

          <div className="flex items-end justify-center gap-5">
            <div className="animate-float rounded-[28px] border border-(--border) bg-white p-3 shadow-[0_16px_40px_rgba(20,27,52,0.10)]">
              <div className="h-[280px] w-[150px] rounded-[22px] border border-(--border) bg-(--bg-muted) p-3">
                <div className="rounded-lg bg-white p-2 text-xs text-(--text-3)">Safety Filter</div>
                <div className="mt-2 rounded-lg bg-(--primary-soft) p-2 text-xs font-semibold text-(--primary)">Ladies Preferred</div>
                <div className="mt-3 rounded-lg bg-white p-2 text-xs text-(--text-2)">Ride Confirmed</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-(--border) bg-white p-3 shadow-[0_16px_40px_rgba(20,27,52,0.10)]">
              <div className="h-[320px] w-[170px] rounded-[22px] border border-(--border) bg-(--bg-muted) p-3">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-(--text-3)">Upcoming Ride</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">HSR Layout</p>
                </div>
                <div className="mt-3 rounded-lg bg-white p-3">
                  <p className="text-xs text-(--text-3)">Driver</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Ananya R.</p>
                </div>
                <div className="mt-3 rounded-lg bg-(--primary) p-3 text-center text-sm font-semibold text-white">
                  Track Booking
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-(--primary)/20 bg-(--primary-soft)/45 px-6 py-10 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-foreground">Ready to ride safer?</h2>
          <p className="mt-3 text-(--text-2)">
            Join SafeRide and start booking with clarity, trust, and women-first confidence.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button className="px-6 py-3">Join Now</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="px-6 py-3">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
