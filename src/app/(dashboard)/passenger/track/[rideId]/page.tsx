"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TrackingMap, {
  type TrackingRoutePoint,
  type TrackingWaypoint,
} from "@/components/ui/TrackingMap";
import { WaveLoader } from "@/components/wave-loader";

interface TrackResponse {
  ride: {
    id: string;
    source: string;
    sourceLat: number | null;
    sourceLng: number | null;
    destination: string;
    destinationLat: number | null;
    destinationLng: number | null;
    status: string;
    scheduledAt: string;
  };
  booking: {
    id: string;
    pickupPoint: string | null;
    pickupLat: number | null;
    pickupLng: number | null;
    dropPoint: string | null;
    dropLat: number | null;
    dropLng: number | null;
  } | null;
  latestLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
}

interface DirectionsResponse {
  waypoints: TrackingWaypoint[];
  routePoints: TrackingRoutePoint[];
  providerError: string | null;
}

export default function PassengerTrackRidePage({
  params,
}: {
  params: Promise<{ rideId: string }>;
}) {
  const { rideId } = use(params);
  const [data, setData] = useState<TrackResponse | null>(null);
  const [waypoints, setWaypoints] = useState<TrackingWaypoint[]>([]);
  const [routePoints, setRoutePoints] = useState<TrackingRoutePoint[]>([]);
  const [routeError, setRouteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`/api/rides/${rideId}/track`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Unable to fetch live tracking");
        return;
      }
      setData(payload);
      setError("");
    } catch {
      setError("Unable to fetch live tracking");
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  const fetchDirections = useCallback(async () => {
    try {
      const res = await fetch(`/api/rides/${rideId}/directions`, {
        cache: "no-store",
      });
      const payload = (await res.json()) as DirectionsResponse;

      if (!res.ok) {
        setRouteError("Planned route is unavailable right now.");
        return;
      }

      setWaypoints(Array.isArray(payload.waypoints) ? payload.waypoints : []);
      setRoutePoints(Array.isArray(payload.routePoints) ? payload.routePoints : []);
      setRouteError(payload.providerError || "");
    } catch {
      setRouteError("Planned route is unavailable right now.");
    }
  }, [rideId]);

  useEffect(() => {
    fetchTracking();
    fetchDirections();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [fetchTracking, fetchDirections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WaveLoader />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/passenger/bookings">
            <Button variant="secondary">Back to Bookings</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-(--text-2)">Tracking data is unavailable.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">Live Ride Tracking</h1>
          <p className="mt-1 text-(--text-2)">
            {data.ride.source} -&gt; {data.ride.destination}
          </p>
        </div>
        <Badge>{data.ride.status}</Badge>
      </div>

      <TrackingMap
        driverLat={data.latestLocation?.latitude ?? null}
        driverLng={data.latestLocation?.longitude ?? null}
        routePoints={routePoints}
        waypoints={waypoints}
      />

      {routeError && (
        <p className="mt-3 text-xs text-(--text-2)">{routeError}</p>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm text-(--text-2)">
        <span>
          Last update:{" "}
          {data.latestLocation
            ? new Date(data.latestLocation.timestamp).toLocaleTimeString()
            : "No update yet"}
        </span>
        <div className="flex items-center gap-2">
          {data.ride.status === "COMPLETED" && (
            <Link href={`/passenger/rate-driver/${data.ride.id}`}>
              <Button variant="primary" className="px-3 py-1.5 text-xs">
                Rate Driver
              </Button>
            </Link>
          )}
          <Link href="/passenger/bookings">
            <Button variant="secondary" className="px-3 py-1.5 text-xs">
              Back to Bookings
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
