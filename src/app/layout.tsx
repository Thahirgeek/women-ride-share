import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "SafeRide - Ride Smarter. Ride Safer.",
  description:
    "SafeRide connects passengers with verified drivers, featuring women-safety filters like ladies-only matching and family-verified rides. Book shared rides with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-[inter-regular]">
        {children}
      </body>
    </html>
  );
}
