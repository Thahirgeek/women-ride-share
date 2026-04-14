import {
  DirectionsProviderError,
  getDrivingRoute,
  type DirectionsCoordinate,
} from "@/lib/directions-provider";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

type WaypointKind = "source" | "pickup" | "drop" | "destination";

interface RouteWaypoint {
  id: string;
  kind: WaypointKind;
  label: string;
  lat: number;
  lng: number;
}

function hasCoordinates(lat: number | null, lng: number | null): lat is number {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  );
}

function dedupeConsecutiveWaypoints(waypoints: RouteWaypoint[]) {
  if (waypoints.length <= 1) return waypoints;

  const deduped: RouteWaypoint[] = [waypoints[0]];

  for (let index = 1; index < waypoints.length; index += 1) {
    const current = waypoints[index];
    const previous = deduped[deduped.length - 1];

    if (
      current.lat.toFixed(6) === previous.lat.toFixed(6) &&
      current.lng.toFixed(6) === previous.lng.toFixed(6)
    ) {
      continue;
    }

    deduped.push(current);
  }

  return deduped;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const requestedBookingId = request.nextUrl.searchParams.get("bookingId");

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      driver: { select: { userId: true } },
      bookings: {
        include: { passenger: { select: { userId: true } } },
      },
    },
  });

  if (!ride) return Response.json({ error: "Ride not found" }, { status: 404 });

  const user = session.user as { role?: string };
  const isAdmin = user.role === "ADMIN";
  const isDriver = ride.driver.userId === session.user.id;
  const confirmedPassengerBooking = ride.bookings.find(
    (booking) =>
      booking.passenger.userId === session.user.id && booking.status === "CONFIRMED"
  );

  if (!isAdmin && !isDriver && !confirmedPassengerBooking) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let bookingForRoute = confirmedPassengerBooking ?? null;

  if ((isAdmin || isDriver) && requestedBookingId) {
    const matchingBooking = ride.bookings.find(
      (booking) => booking.id === requestedBookingId && booking.status === "CONFIRMED"
    );

    if (matchingBooking) {
      bookingForRoute = matchingBooking;
    }
  }

  const rawWaypoints: RouteWaypoint[] = [];

  if (hasCoordinates(ride.sourceLat, ride.sourceLng)) {
    rawWaypoints.push({
      id: "source",
      kind: "source",
      label: ride.source,
      lat: ride.sourceLat,
      lng: ride.sourceLng!,
    });
  }

  if (bookingForRoute && hasCoordinates(bookingForRoute.pickupLat, bookingForRoute.pickupLng)) {
    rawWaypoints.push({
      id: "pickup",
      kind: "pickup",
      label: bookingForRoute.pickupPoint || "Pickup",
      lat: bookingForRoute.pickupLat,
      lng: bookingForRoute.pickupLng!,
    });
  }

  if (bookingForRoute && hasCoordinates(bookingForRoute.dropLat, bookingForRoute.dropLng)) {
    rawWaypoints.push({
      id: "drop",
      kind: "drop",
      label: bookingForRoute.dropPoint || "Drop",
      lat: bookingForRoute.dropLat,
      lng: bookingForRoute.dropLng!,
    });
  }

  if (hasCoordinates(ride.destinationLat, ride.destinationLng)) {
    rawWaypoints.push({
      id: "destination",
      kind: "destination",
      label: ride.destination,
      lat: ride.destinationLat,
      lng: ride.destinationLng!,
    });
  }

  const waypoints = dedupeConsecutiveWaypoints(rawWaypoints);
  const coordinates: DirectionsCoordinate[] = waypoints.map(({ lat, lng }) => ({ lat, lng }));

  if (coordinates.length < 2) {
    return Response.json({
      provider: "mapbox",
      waypoints,
      routePoints: [],
      distanceMeters: null,
      durationSeconds: null,
      bookingIdUsed: bookingForRoute?.id ?? null,
      providerError: "Not enough route coordinates to calculate planned route.",
    });
  }

  try {
    const route = await getDrivingRoute(coordinates);

    return Response.json({
      provider: "mapbox",
      waypoints,
      routePoints: route.points,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      bookingIdUsed: bookingForRoute?.id ?? null,
      providerError: null,
    });
  } catch (error) {
    const providerError =
      error instanceof DirectionsProviderError
        ? error.message
        : "Unable to calculate planned route at the moment.";

    return Response.json({
      provider: "mapbox",
      waypoints,
      routePoints: [],
      distanceMeters: null,
      durationSeconds: null,
      bookingIdUsed: bookingForRoute?.id ?? null,
      providerError,
    });
  }
}