"use client";

import type { LatLngTuple } from "leaflet";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((module) => module.Polyline),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((module) => module.CircleMarker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((module) => module.Tooltip),
  { ssr: false }
);

export interface TrackingRoutePoint {
  lat: number;
  lng: number;
}

export interface TrackingWaypoint {
  id: string;
  kind: "source" | "pickup" | "drop" | "destination";
  label: string;
  lat: number;
  lng: number;
}

interface TrackingMapProps {
  driverLat: number | null;
  driverLng: number | null;
  title?: string;
  routePoints?: TrackingRoutePoint[];
  waypoints?: TrackingWaypoint[];
}

const waypointColors: Record<TrackingWaypoint["kind"], string> = {
  source: "#2563eb",
  pickup: "#16a34a",
  drop: "#f97316",
  destination: "#dc2626",
};

const INDIA_CENTER: LatLngTuple = [20.5937, 78.9629];

export default function TrackingMap({
  driverLat,
  driverLng,
  title = "Live Driver Location",
  routePoints = [],
  waypoints = [],
}: TrackingMapProps) {
  const driverPoint = useMemo(
    () =>
      typeof driverLat === "number" && Number.isFinite(driverLat) &&
      typeof driverLng === "number" && Number.isFinite(driverLng)
        ? ([driverLat, driverLng] as LatLngTuple)
        : null,
    [driverLat, driverLng]
  );

  const plannedRoute = useMemo(
    () =>
      routePoints
        .filter(
          (point) =>
            Number.isFinite(point.lat) && Number.isFinite(point.lng)
        )
        .map((point) => [point.lat, point.lng] as LatLngTuple),
    [routePoints]
  );

  const validWaypoints = useMemo(
    () =>
      waypoints.filter(
        (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)
      ),
    [waypoints]
  );

  const boundsPoints = useMemo(() => {
    const points: LatLngTuple[] = [
      ...plannedRoute,
      ...validWaypoints.map((point) => [point.lat, point.lng] as LatLngTuple),
    ];

    if (driverPoint) points.push(driverPoint);
    return points;
  }, [plannedRoute, validWaypoints, driverPoint]);

  if (boundsPoints.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-(--bg-muted) p-6 text-sm text-(--text-2)">
        Waiting for route and driver location updates...
      </div>
    );
  }

  const initialCenter =
    driverPoint ??
    plannedRoute[0] ??
    (validWaypoints[0]
      ? ([validWaypoints[0].lat, validWaypoints[0].lng] as LatLngTuple)
      : INDIA_CENTER);
  const mapBounds = boundsPoints.length > 1 ? boundsPoints : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-(--bg-muted) px-4 py-3 text-sm font-semibold text-foreground">
        {title}
      </div>
      <MapContainer
        center={initialCenter}
        zoom={13}
        bounds={mapBounds}
        boundsOptions={{ padding: [30, 30] }}
        scrollWheelZoom
        className="h-70 w-full sm:h-85 lg:h-104"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {plannedRoute.length > 1 && (
          <Polyline
            positions={plannedRoute}
            pathOptions={{
              color: "#1d4ed8",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}

        {validWaypoints.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{
              color: waypointColors[point.kind],
              fillColor: waypointColors[point.kind],
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip>{point.label}</Tooltip>
          </CircleMarker>
        ))}

        {driverPoint && (
          <CircleMarker
            center={driverPoint}
            radius={8}
            pathOptions={{
              color: "#111827",
              fillColor: "#111827",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Tooltip>Driver current location</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
      <div className="border-t border-border bg-white px-4 py-2 text-xs text-(--text-2)">
        {driverPoint
          ? `Driver coordinates: ${driverPoint[0].toFixed(5)}, ${driverPoint[1].toFixed(5)}`
          : "Driver coordinates unavailable. Planned route is still shown."}
      </div>
    </div>
  );
}
