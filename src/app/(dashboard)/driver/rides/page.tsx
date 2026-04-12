"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { WaveLoader } from "@/components/wave-loader";
import CompositionBadge from "@/components/safety/CompositionBadge";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Ride {
  id: string;
  source: string;
  destination: string;
  scheduledAt: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
  fare: number;
  currentPassengerComposition: string;
  notes?: string;
  _count?: { bookings: number };
}

export default function DriverRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = async () => {
    const res = await fetch("/api/rides?driver=me");
    const data = await res.json();
    setRides(data.rides || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const updateStatus = async (rideId: string, status: string) => {
    await fetch(`/api/rides/${rideId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRides();
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "OPEN":
        return "success" as const;
      case "BOOKED":
        return "blue" as const;
      case "ONGOING":
        return "purple" as const;
      case "COMPLETED":
        return "default" as const;
      case "CANCELLED":
        return "danger" as const;
      default:
        return "warning" as const;
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">My Rides</h1>
          <p className="mt-1 text-(--text-2)">Manage your published rides.</p>
        </div>
        <Link href="/driver/rides/create">
          <Button><Plus size={15} /> Create Ride</Button>
        </Link>
      </div>

      {rides.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-(--text-2) py-6">
            No rides created yet.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rides.map((ride) => (
            <Card key={ride.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-[inter-semibold] text-foreground">
                      {ride.source}
                    </span>
                    <span className="text-(--text-3)">-&gt;</span>
                    <span className="font-[inter-semibold] text-foreground">
                      {ride.destination}
                    </span>
                  </div>
                  <p className="text-xs text-(--text-2)">
                    {new Date(ride.scheduledAt).toLocaleString()} - Rs {ride.fare}
                    /seat
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CompositionBadge composition={ride.currentPassengerComposition} />
                  <Badge variant={statusVariant(ride.status)}>
                    {ride.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--text-2)">
                  {ride.totalSeats - ride.availableSeats} / {ride.totalSeats}{" "}
                  seats filled
                </span>
                <div className="flex gap-2">
                  {(ride.status === "BOOKED" || ride.status === "ONGOING") && (
                    <Link href={`/driver/track/${ride.id}`}>
                      <Button variant="secondary" className="text-xs px-3 py-1.5">
                        Track Live
                      </Button>
                    </Link>
                  )}
                  {ride.status === "CREATED" && (
                    <Button
                      variant="primary"
                      className="text-xs px-3 py-1.5"
                      onClick={() => updateStatus(ride.id, "OPEN")}
                    >
                      Publish
                    </Button>
                  )}
                  {ride.status === "BOOKED" && (
                    <Button
                      variant="primary"
                      className="text-xs px-3 py-1.5"
                      onClick={() => updateStatus(ride.id, "ONGOING")}
                    >
                      Start Ride
                    </Button>
                  )}
                  {ride.status === "ONGOING" && (
                    <Button
                      variant="primary"
                      className="text-xs px-3 py-1.5"
                      onClick={() => updateStatus(ride.id, "COMPLETED")}
                    >
                      Complete
                    </Button>
                  )}
                  {(ride.status === "OPEN" || ride.status === "BOOKED") && (
                    <Button
                      variant="danger"
                      className="text-xs px-3 py-1.5"
                      onClick={() => updateStatus(ride.id, "CANCELLED")}
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
    </>
  );
}
