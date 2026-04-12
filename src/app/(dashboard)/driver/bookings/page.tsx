"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { WaveLoader } from "@/components/wave-loader";
import ChatWindow from "@/components/chat/ChatWindow";

interface BookingRequest {
  id: string;
  seatCount: number;
  pickupPoint: string;
  dropPoint: string;
  status: string;
  passenger: {
    user: { name: string; gender: string };
  };
  ride: {
    source: string;
    destination: string;
    scheduledAt: string;
  };
}

export default function DriverBookingsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(
    null
  );

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings?driver=me");
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (bookingId: string, status: string) => {
    await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchBookings();
  };

  const genderBadge = (gender: string) => {
    switch (gender) {
      case "FEMALE":
        return <Badge variant="purple">Female</Badge>;
      case "MALE":
        return <Badge variant="blue">Male</Badge>;
      default:
        return <Badge>Other</Badge>;
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
        <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">Booking Requests</h1>
        <p className="mt-1 text-(--text-2)">
          Manage passenger booking requests on your rides.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-(--text-2) py-6">
            No booking requests yet.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-[inter-semibold] text-foreground">
                      {booking.passenger.user.name}
                    </span>
                    {genderBadge(booking.passenger.user.gender)}
                  </div>
                  <p className="text-xs text-(--text-2)">
                    {booking.ride.source} -&gt; {booking.ride.destination} -{" "}
                    {booking.seatCount} seat(s)
                  </p>
                  <p className="text-xs text-(--text-2)">
                    Pickup: {booking.pickupPoint || "-"} - Drop:{" "}
                    {booking.dropPoint || "-"}
                  </p>
                </div>
                <Badge
                  variant={
                    booking.status === "PENDING"
                      ? "warning"
                      : booking.status === "CONFIRMED"
                        ? "success"
                        : "danger"
                  }
                >
                  {booking.status}
                </Badge>
              </div>
              {booking.status === "PENDING" && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="primary"
                    className="text-xs px-3 py-1.5"
                    onClick={() => handleAction(booking.id, "CONFIRMED")}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="danger"
                    className="text-xs px-3 py-1.5"
                    onClick={() => handleAction(booking.id, "CANCELLED")}
                  >
                    Reject
                  </Button>
                </div>
              )}
              {booking.status === "CONFIRMED" && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    className="text-xs px-3 py-1.5"
                    onClick={() => setActiveChatBookingId(booking.id)}
                  >
                    Chat with Passenger
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeChatBookingId && (
        <ChatWindow
          bookingId={activeChatBookingId}
          isOpen={Boolean(activeChatBookingId)}
          onClose={() => setActiveChatBookingId(null)}
          title="Driver Chat"
        />
      )}
    </>
  );
}
