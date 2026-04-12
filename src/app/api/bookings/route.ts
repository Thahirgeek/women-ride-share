import { auth } from "@/lib/auth";
import { isLocationSuggestion, normalizeLocationLabel } from "@/lib/location-utils";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const driverFilter = url.searchParams.get("driver");

  // Driver viewing bookings on their rides
  if (driverFilter === "me") {
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });
    if (!driver) return Response.json({ bookings: [] });

    const bookings = await prisma.booking.findMany({
      where: { ride: { driverId: driver.id } },
      include: {
        ride: { select: { source: true, destination: true, scheduledAt: true } },
        passenger: {
          include: { user: { select: { name: true, gender: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ bookings });
  }

  // Passenger viewing their bookings
  const passenger = await prisma.passenger.findUnique({
    where: { userId: session.user.id },
  });
  if (!passenger) return Response.json({ bookings: [] });

  const bookings = await prisma.booking.findMany({
    where: { passengerId: passenger.id },
    include: {
      ride: {
        include: {
          driver: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const driverIds = [...new Set(bookings.map((booking) => booking.ride.driver.id))];
  const summaries =
    driverIds.length > 0
      ? await prisma.rating.groupBy({
          by: ["driverId"],
          where: {
            driverId: { in: driverIds },
            passengerId: { not: null },
          },
          _avg: { score: true },
          _count: { _all: true },
        })
      : [];

  const summaryByDriverId = new Map(
    summaries
      .filter(
        (item): item is typeof item & { driverId: string } =>
          typeof item.driverId === "string"
      )
      .map((item) => [item.driverId, item])
  );

  const bookingsWithRatings = bookings.map((booking) => {
    const summary = summaryByDriverId.get(booking.ride.driver.id);

    return {
      ...booking,
      ride: {
        ...booking.ride,
        driver: {
          ...booking.ride.driver,
          ratingSummary: {
            averageScore:
              typeof summary?._avg.score === "number"
                ? Math.round(summary._avg.score * 10) / 10
                : null,
            totalRatings: summary?._count._all ?? 0,
          },
        },
      },
    };
  });

  return Response.json({ bookings: bookingsWithRatings });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "PASSENGER") {
    return Response.json({ error: "Only passengers can book rides" }, { status: 403 });
  }

  const passenger = await prisma.passenger.findUnique({
    where: { userId: session.user.id },
  });
  if (!passenger) {
    return Response.json({ error: "Passenger profile not found. Complete onboarding first." }, { status: 400 });
  }

  const body = await request.json();
  const { rideId, pickupLocation, dropLocation, seatCount = 1 } = body;

  if (!isLocationSuggestion(pickupLocation) || !isLocationSuggestion(dropLocation)) {
    return Response.json(
      { error: "Pickup and drop locations must be selected from suggestions." },
      { status: 400 }
    );
  }

  const parsedSeatCount = Number.parseInt(String(seatCount), 10);
  if (!Number.isFinite(parsedSeatCount) || parsedSeatCount < 1) {
    return Response.json({ error: "Seat count must be at least 1" }, { status: 400 });
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) return Response.json({ error: "Ride not found" }, { status: 404 });
  if (ride.status !== "OPEN") {
    return Response.json({ error: "Ride is not available for booking" }, { status: 400 });
  }
  if (ride.availableSeats < parsedSeatCount) {
    return Response.json({ error: "Not enough seats available" }, { status: 400 });
  }

  const normalizedPickup = normalizeLocationLabel(pickupLocation.label);
  const normalizedDrop = normalizeLocationLabel(dropLocation.label);

  const booking = await prisma.booking.create({
    data: {
      rideId,
      passengerId: passenger.id,
      seatCount: parsedSeatCount,
      pickupPoint: normalizedPickup,
      pickupPlaceId: pickupLocation.placeId,
      pickupLat: pickupLocation.lat,
      pickupLng: pickupLocation.lng,
      dropPoint: normalizedDrop,
      dropPlaceId: dropLocation.placeId,
      dropLat: dropLocation.lat,
      dropLng: dropLocation.lng,
      status: "PENDING",
    },
  });

  return Response.json({ booking }, { status: 201 });
}
