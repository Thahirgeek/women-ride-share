"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { WaveLoader } from "@/components/wave-loader";
import CompositionBadge from "@/components/safety/CompositionBadge";

interface Booking {
  id: string;
  pickupPoint: string;
  dropPoint: string;
  seatCount: number;
  status: string;
  createdAt: string;
  ride: {
    source: string;
    destination: string;
    scheduledAt: string;
    fare: number;
    currentPassengerComposition: string;
    driver: {
      user: { name: string };
    };
  };
}

export default function PassengerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    fetchBookings();
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning" as const;
      case "CONFIRMED":
        return "success" as const;
      case "CANCELLED":
        return "danger" as const;
      default:
        return "default" as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WaveLoader />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">My Bookings</h1>
        <p className="mt-1 text-(--text-2)">Track all your ride bookings.</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-(--text-2) py-6">
            No bookings yet.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-[inter-semibold] text-foreground">
                      {booking.ride.source}
                    </span>
                    <span className="text-(--text-3)">-&gt;</span>
                    <span className="font-[inter-semibold] text-foreground">
                      {booking.ride.destination}
                    </span>
                  </div>
                  <p className="text-sm text-(--text-2)">
                    Driver: {booking.ride.driver.user.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CompositionBadge
                    composition={booking.ride.currentPassengerComposition}
                  />
                  <Badge variant={statusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-(--text-2)">
                <div>
                  <p className="">
                    Route: {booking.pickupPoint || "-"} -&gt; {booking.dropPoint || "-"}
                  </p>
                  <p>
                    Time: {new Date(booking.ride.scheduledAt).toLocaleString()} -{" "}
                    {booking.seatCount} seat(s) - Rs 
                    {booking.ride.fare * booking.seatCount}
                  </p>
                </div>
                {booking.status === "PENDING" && (
                  <Button
                    variant="danger"
                    className="text-xs px-3 py-1.5"
                    onClick={() => handleCancel(booking.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
