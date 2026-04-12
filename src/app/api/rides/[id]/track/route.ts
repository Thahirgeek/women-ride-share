import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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

  const locations = await prisma.location.findMany({
    where: { rideId: id },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  const latestLocation = locations[0] ?? null;

  return Response.json({
    ride: {
      id: ride.id,
      source: ride.source,
      sourceLat: ride.sourceLat,
      sourceLng: ride.sourceLng,
      destination: ride.destination,
      destinationLat: ride.destinationLat,
      destinationLng: ride.destinationLng,
      status: ride.status,
      scheduledAt: ride.scheduledAt,
    },
    booking:
      confirmedPassengerBooking
        ? {
            id: confirmedPassengerBooking.id,
            pickupPoint: confirmedPassengerBooking.pickupPoint,
            pickupLat: confirmedPassengerBooking.pickupLat,
            pickupLng: confirmedPassengerBooking.pickupLng,
            dropPoint: confirmedPassengerBooking.dropPoint,
            dropLat: confirmedPassengerBooking.dropLat,
            dropLng: confirmedPassengerBooking.dropLng,
          }
        : null,
    latestLocation,
    locations: [...locations].reverse(),
  });
}
