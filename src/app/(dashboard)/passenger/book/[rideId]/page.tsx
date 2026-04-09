"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CompositionBadge from "@/components/safety/CompositionBadge";
import RippleWaveLoader from "@/components/RippleWaveLoader";

interface RideDetails {
  id: string;
  source: string;
  destination: string;
  scheduledAt: string;
  fare: number;
  availableSeats: number;
  totalSeats: number;
  currentPassengerComposition: string;
  notes?: string;
  driver: {
    user: { name: string; gender: string };
    vehicle?: { vehicleType: string; model: string; color: string; registrationNumber: string };
  };
}

export default function BookRidePage({
  params,
}: {
  params: Promise<{ rideId: string }>;
}) {
  const { rideId } = use(params);
  const router = useRouter();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropPoint, setDropPoint] = useState("");
  const [seatCount, setSeatCount] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/rides?id=${rideId}`)
      .then((r) => r.json())
      .then((data) => {
        setRide(data.ride || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rideId]);

  const handleBook = async () => {
    setError("");
    setBooking(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId,
          pickupPoint,
          dropPoint,
          seatCount: parseInt(seatCount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Booking failed");
      } else {
        setBooked(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RippleWaveLoader />
      </div>
    );
  }

  if (!ride) {
    return (
      <Card>
        <p className="text-center text-(--text-2) py-6">Ride not found.</p>
      </Card>
    );
  }

  if (booked) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          OK
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-(--text-2) mb-8">
          Awaiting driver confirmation. You&apos;ll be notified when accepted.
        </p>

        {/* Payment placeholder */}
        <Card className="w-full max-w-md opacity-60">
          <div className="flex items-center gap-3 text-(--text-3)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <p className="text-sm font-medium">Payment step</p>
              <p className="text-xs">
                Payment processing would happen here
              </p>
            </div>
          </div>
        </Card>

        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => router.push("/passenger/bookings")}
        >
          View My Bookings
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Book Ride</h1>
        <p className="mt-1 text-(--text-2)">
          Review ride details and confirm your booking.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ride details */}
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Ride Details
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{ride.source}</span>
                <span className="text-(--text-3)">-&gt;</span>
                <span className="font-semibold text-foreground">{ride.destination}</span>
              </div>
              <p className="text-sm text-(--text-2)">
                Time: {new Date(ride.scheduledAt).toLocaleString()}
              </p>
              <p className="text-sm text-(--text-2)">
                Seats: {ride.availableSeats} seats available
              </p>
              <p className="text-lg font-bold text-foreground">
                Rs {ride.fare} per seat
              </p>
              {ride.notes && (
                <p className="text-sm text-(--text-2) italic">
                  &quot;{ride.notes}&quot;
                </p>
              )}
            </div>
          </Card>

          {/* Safety Snapshot */}
          <Card>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Safety Snapshot
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--text-2)">Driver</span>
                <span className="text-sm font-semibold text-foreground">{ride.driver.user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--text-2)">Gender</span>
                <span className="text-sm font-semibold text-foreground">{ride.driver.user.gender}</span>
              </div>
              {ride.driver.vehicle && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-(--text-2)">Vehicle</span>
                  <span className="text-sm font-semibold text-foreground">
                    {ride.driver.vehicle.model} ({ride.driver.vehicle.color})
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--text-2)">Current Composition</span>
                <CompositionBadge composition={ride.currentPassengerComposition} />
              </div>
            </div>
          </Card>
        </div>

        {/* Booking form */}
        <div>
          <Card>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Your Booking
            </h2>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <Input
                id="pickup"
                label="Pickup Point"
                placeholder="Your pickup location"
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
                required
              />
              <Input
                id="drop"
                label="Drop Point"
                placeholder="Your drop location"
                value={dropPoint}
                onChange={(e) => setDropPoint(e.target.value)}
                required
              />
              <Input
                id="seats"
                label="Number of Seats"
                type="number"
                min="1"
                max={String(ride.availableSeats)}
                value={seatCount}
                onChange={(e) => setSeatCount(e.target.value)}
              />
              <div className="mt-2 rounded-lg bg-(--bg-muted) p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--text-2)">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    Rs {ride.fare * parseInt(seatCount || "1")}
                  </span>
                </div>
              </div>
              <Button onClick={handleBook} isLoading={booking} fullWidth>
                Confirm Booking
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
