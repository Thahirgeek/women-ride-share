import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const id = url.searchParams.get("id");
  const source = url.searchParams.get("source");
  const destination = url.searchParams.get("destination");
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

  if (source) {
    where.source = { contains: source, mode: "insensitive" };
  }
  if (destination) {
    where.destination = { contains: destination, mode: "insensitive" };
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
  const { source, destination, scheduledAt, totalSeats, fare, currentPassengerComposition, notes } = body;

  const ride = await prisma.ride.create({
    data: {
      driverId: driver.id,
      source,
      destination,
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
