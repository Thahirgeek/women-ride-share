"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { WaveLoader } from "@/components/wave-loader";
import CompositionBadge from "@/components/safety/CompositionBadge";
import ChatWindow from "@/components/chat/ChatWindow";
import RatingSummary from "@/components/ratings/RatingSummary";
import Link from "next/link";

interface Booking {
  id: string;
  pickupPoint: string;
  dropPoint: string;
  seatCount: number;
  status: string;
  createdAt: string;
  ride: {
    id: string;
    source: string;
    destination: string;
    scheduledAt: string;
    status: string;
    fare: number;
    currentPassengerComposition: string;
    driver: {
      user: { name: string };
      ratingSummary?: {
        averageScore: number | null;
        totalRatings: number;
      };
    };
  };
}

export default function PassengerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(
    null
  );

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
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">My Bookings</h1>
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
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                  <RatingSummary
                    averageScore={booking.ride.driver.ratingSummary?.averageScore ?? null}
                    totalRatings={booking.ride.driver.ratingSummary?.totalRatings ?? 0}
                    className="mt-1"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CompositionBadge
                    composition={booking.ride.currentPassengerComposition}
                  />
                  <Badge variant={statusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-sm text-(--text-2) sm:flex-row sm:items-center sm:justify-between">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {booking.status === "CONFIRMED" && (
                    <Button
                      variant="secondary"
                      className="w-full px-3 py-1.5 text-xs sm:w-auto"
                      onClick={() => setActiveChatBookingId(booking.id)}
                    >
                      Chat
                    </Button>
                  )}
                  {booking.status === "CONFIRMED" && booking.ride.status === "COMPLETED" && (
                    <Link href={`/passenger/rate-driver/${booking.ride.id}`}>
                      <Button variant="primary" className="w-full whitespace-nowrap px-3 py-1.5 text-xs sm:w-auto">
                        Rate Driver
                      </Button>
                    </Link>
                  )}
                  {booking.status === "CONFIRMED" &&
                    (booking.ride.status === "BOOKED" ||
                      booking.ride.status === "ONGOING") && (
                      <Link href={`/passenger/track/${booking.ride.id}`}>
                        <Button variant="primary" className="w-full px-3 py-1.5 text-xs sm:w-auto">
                          Track
                        </Button>
                      </Link>
                    )}
                  {booking.status === "PENDING" && (
                    <Button
                      variant="danger"
                      className="w-full px-3 py-1.5 text-xs sm:w-auto"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeChatBookingId && (
        <ChatWindow
          bookingId={activeChatBookingId}
          isOpen={Boolean(activeChatBookingId)}
          onClose={() => setActiveChatBookingId(null)}
          title="Passenger Chat"
        />
      )}
    </>
  );
}
