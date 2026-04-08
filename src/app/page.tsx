import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const features = [
  {
    icon: "👩",
    title: "Ladies-Only Matching",
    description:
      "Filter rides to match only with drivers carrying lady passengers. Travel with peace of mind.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family-Verified Drivers",
    description:
      "Choose rides where families and children are already onboard for a comfortable, safe journey.",
  },
  {
    icon: "📍",
    title: "Real-Time Tracking",
    description:
      "Track your ride with location updates. Share your trip status with trusted contacts anytime.",
  },
];

const steps = [
  {
    step: "01",
    title: "Register",
    description: "Create your account and choose your role — passenger or driver.",
  },
  {
    step: "02",
    title: "Search & Filter",
    description: "Find rides using safety filters. See who's onboard before you book.",
  },
  {
    step: "03",
    title: "Book & Ride",
    description: "Confirm your booking, meet your driver, and enjoy a safer ride.",
  },
];

const vehicles = [
  { icon: "🚗", label: "Car", desc: "Comfortable sedan rides" },
  { icon: "🛺", label: "Auto", desc: "Quick city commutes" },
  { icon: "🚐", label: "Van", desc: "Group and family rides" },
  { icon: "🚕", label: "Taxi", desc: "Professional cab service" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Background dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #c4c4c4 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Trusted by 10,000+ riders
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-7xl">
              Ride Smarter.
              <br />
              <span className="font-[var(--font-instrument-serif)] italic text-gray-600">
                Ride Safer.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
              Book shared rides with women‑safety filters. See who&apos;s onboard
              before you travel — ladies‑only, family rides, or mixed groups.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button variant="primary" className="px-8 py-3 text-base">
                  Find a Ride
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="px-8 py-3 text-base">
                  Offer a Ride
                </Button>
              </Link>
            </div>

            {/* Decorative ride card mockup */}
            <div className="mt-16 w-full max-w-md">
              <Card className="text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                      SR
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Sarah Rahman
                      </p>
                      <p className="text-xs text-gray-500">Toyota Camry • White</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                    👩 Ladies Onboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-medium text-gray-900">Koramangala</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-900">Whitefield</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Today, 5:30 PM</span>
                  <span className="font-semibold text-gray-900">₹120 / seat</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">3 seats available</span>
                  <span className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white">
                    Book Ride →
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Safety, built in
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Every feature designed with your safety as the top priority.
            </p>
          </div>
          <div id="safety" className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {f.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Three simple steps to a safer ride.
            </p>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-3">
            {/* Dashed connector line — desktop only */}
            <div className="absolute top-12 left-[20%] right-[20%] hidden h-px border-t-2 border-dashed border-gray-300 sm:block" />
            {steps.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose your ride
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Multiple vehicle types for every journey.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {vehicles.map((v) => (
              <Card key={v.label} className="text-center transition-transform duration-200 hover:-translate-y-1">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="text-base font-bold text-gray-900">{v.label}</h3>
                <p className="mt-1 text-xs text-gray-500">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to ride safer?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Join thousands of passengers and drivers who trust SafeRide.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button variant="primary" className="px-10 py-3 text-base">
                Get Started — it&apos;s free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
