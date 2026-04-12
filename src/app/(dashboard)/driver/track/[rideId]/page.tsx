"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
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

export default function DriverTrackRidePage({
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
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async () => {
    const res = await fetch(`/api/rides/${rideId}/track`, { cache: "no-store" });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.error || "Unable to fetch tracking status");
    }
    setData(payload);
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

  const pushLocation = async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`/api/rides/${rideId}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });

          const payload = await res.json();
          if (!res.ok) {
            setError(payload.error || "Failed to send location");
            return;
          }

          setError("");
          await fetchTracking();
        } catch {
          setError("Failed to send location");
        }
      },
      () => {
        setError("Unable to access your location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const startSharing = async () => {
    setSharing(true);
    await pushLocation();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      pushLocation();
    }, 5000);
  };

  const stopSharing = () => {
    setSharing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchTracking(), fetchDirections()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load tracking page");
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => stopSharing();
  }, [rideId, fetchTracking, fetchDirections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WaveLoader />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-red-600">{error || "Tracking data is unavailable."}</p>
      </Card>
    );
  }

  const canShare = data.ride.status === "BOOKED" || data.ride.status === "ONGOING";

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">Driver Live Tracking</h1>
          <p className="mt-1 text-(--text-2)">
            {data.ride.source} -&gt; {data.ride.destination}
          </p>
        </div>
        <Badge>{data.ride.status}</Badge>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        {!sharing ? (
          <Button onClick={startSharing} disabled={!canShare}>
            Start Sharing Location
          </Button>
        ) : (
          <Button variant="danger" onClick={stopSharing}>
            Stop Sharing
          </Button>
        )}
        <Link href="/driver/rides">
          <Button variant="secondary">Back to My Rides</Button>
        </Link>
      </div>

      {!canShare && (
        <p className="mb-4 text-sm text-(--text-2)">
          Tracking is available only while the ride is BOOKED or ONGOING.
        </p>
      )}

      <TrackingMap
        driverLat={data.latestLocation?.latitude ?? null}
        driverLng={data.latestLocation?.longitude ?? null}
        routePoints={routePoints}
        waypoints={waypoints}
      />

      {routeError && (
        <p className="mt-3 text-xs text-(--text-2)">{routeError}</p>
      )}
    </>
  );
}
