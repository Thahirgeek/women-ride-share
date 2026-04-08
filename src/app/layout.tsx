import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const instrumentSans = localFont({
  src: "../../public/fonts/Instrument_Sans/InstrumentSans-VariableFont_wdth,wght.ttf",
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = localFont({
  src: "../../public/fonts/InstrumentSerif/InstrumentSerif-Regular.ttf",
  variable: "--font-instrument-serif",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "SafeRide — Ride Smarter. Ride Safer.",
  description:
    "SafeRide connects passengers with verified drivers, featuring women-safety filters like ladies-only matching and family-verified rides. Book shared rides with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f5f5] text-gray-900 font-[var(--font-instrument-sans)]">
        {children}
      </body>
    </html>
  );
}
