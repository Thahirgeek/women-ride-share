import { auth } from "@/lib/auth";
import { isLocationSuggestion, normalizeLocationLabel } from "@/lib/location-utils";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const id = url.searchParams.get("id");
  const source = url.searchParams.get("source")?.trim() ?? "";
  const destination = url.searchParams.get("destination")?.trim() ?? "";
  const sourcePlaceId = url.searchParams.get("sourcePlaceId")?.trim() ?? "";
  const destinationPlaceId =
    url.searchParams.get("destinationPlaceId")?.trim() ?? "";
  const safetyFilter = url.searchParams.get("safetyFilter");
  const driverFilter = url.searchParams.get("driver");

  // Single ride fetch
  if (id) {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: { select: { name: true, gender: true } },
            vehicle: true,
          },
        },
      },
    });
    return Response.json({ ride });
  }

  // Driver's own rides
  if (driverFilter === "me") {
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });
    if (!driver) return Response.json({ rides: [] });

    const rides = await prisma.ride.findMany({
      where: { driverId: driver.id },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ rides });
  }

  // Public search
  const where: Record<string, unknown> = {
    status: "OPEN",
    availableSeats: { gt: 0 },
    driver: { isVerified: true },
  };

  const andFilters: Record<string, unknown>[] = [];

  if (sourcePlaceId) {
    const sourceOrFilters: Record<string, unknown>[] = [{ sourcePlaceId }];

    // Preserve discoverability for legacy rides that predate place IDs.
    if (source) {
      sourceOrFilters.push({
        AND: [
          { sourcePlaceId: null },
          { source: { contains: source, mode: "insensitive" } },
        ],
      });
    }

    andFilters.push({ OR: sourceOrFilters });
  } else if (source) {
    andFilters.push({ source: { contains: source, mode: "insensitive" } });
  }

  if (destinationPlaceId) {
    const destinationOrFilters: Record<string, unknown>[] = [
      { destinationPlaceId },
    ];

    // Preserve discoverability for legacy rides that predate place IDs.
    if (destination) {
      destinationOrFilters.push({
        AND: [
          { destinationPlaceId: null },
          { destination: { contains: destination, mode: "insensitive" } },
        ],
      });
    }

    andFilters.push({ OR: destinationOrFilters });
  } else if (destination) {
    andFilters.push({ destination: { contains: destination, mode: "insensitive" } });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  if (safetyFilter === "LADIES_ONLY") {
    where.currentPassengerComposition = "LADIES";
  } else if (safetyFilter === "FAMILY_PREFERRED") {
    where.currentPassengerComposition = "FAMILY";
  }

  const rides = await prisma.ride.findMany({
    where,
    include: {
      driver: {
        include: {
          user: { select: { name: true, gender: true } },
          vehicle: { select: { vehicleType: true, model: true, color: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return Response.json({ rides });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "DRIVER") {
    return Response.json({ error: "Only drivers can create rides" }, { status: 403 });
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id },
  });
  if (!driver) {
    return Response.json({ error: "Driver profile not found" }, { status: 400 });
  }
  if (!driver.isVerified) {
    return Response.json(
      {
        code: "DRIVER_NOT_VERIFIED",
        error: "Driver verification required before publishing rides.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    sourceLocation,
    destinationLocation,
    scheduledAt,
    totalSeats,
    fare,
    currentPassengerComposition,
    notes,
  } = body;

  if (
    !isLocationSuggestion(sourceLocation) ||
    !isLocationSuggestion(destinationLocation)
  ) {
    return Response.json(
      {
        error:
          "Source and destination must be selected from location suggestions.",
      },
      { status: 400 }
    );
  }

  if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
    return Response.json({ error: "A valid schedule date is required" }, { status: 400 });
  }

  if (!Number.isFinite(totalSeats) || totalSeats < 1) {
    return Response.json({ error: "Total seats must be at least 1" }, { status: 400 });
  }

  if (!Number.isFinite(fare) || fare <= 0) {
    return Response.json({ error: "Fare must be greater than 0" }, { status: 400 });
  }

  const normalizedSource = normalizeLocationLabel(sourceLocation.label);
  const normalizedDestination = normalizeLocationLabel(destinationLocation.label);

  const ride = await prisma.ride.create({
    data: {
      driverId: driver.id,
      source: normalizedSource,
      sourcePlaceId: sourceLocation.placeId,
      sourceLat: sourceLocation.lat,
      sourceLng: sourceLocation.lng,
      destination: normalizedDestination,
      destinationPlaceId: destinationLocation.placeId,
      destinationLat: destinationLocation.lat,
      destinationLng: destinationLocation.lng,
      scheduledAt: new Date(scheduledAt),
      totalSeats,
      availableSeats: totalSeats,
      fare,
      currentPassengerComposition: currentPassengerComposition || "SOLO",
      notes,
      status: "OPEN",
    },
  });

  return Response.json({ ride }, { status: 201 });
}
