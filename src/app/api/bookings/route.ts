import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const driverFilter = url.searchParams.get("driver");
  const user = session.user as any;

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

  return Response.json({ bookings });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
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
  const { rideId, pickupPoint, dropPoint, seatCount = 1 } = body;

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) return Response.json({ error: "Ride not found" }, { status: 404 });
  if (ride.status !== "OPEN") {
    return Response.json({ error: "Ride is not available for booking" }, { status: 400 });
  }
  if (ride.availableSeats < seatCount) {
    return Response.json({ error: "Not enough seats available" }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: {
      rideId,
      passengerId: passenger.id,
      seatCount,
      pickupPoint,
      dropPoint,
      status: "PENDING",
    },
  });

  return Response.json({ booking }, { status: 201 });
}
