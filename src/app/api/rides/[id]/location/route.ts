import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const MIN_UPDATE_INTERVAL_MS = 3000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "DRIVER") {
    return Response.json({ error: "Only drivers can update location" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return Response.json({ error: "Coordinates out of range" }, { status: 400 });
  }

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: { driver: { select: { userId: true } } },
  });

  if (!ride) return Response.json({ error: "Ride not found" }, { status: 404 });
  if (ride.driver.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (ride.status !== "BOOKED" && ride.status !== "ONGOING") {
    return Response.json(
      { error: "Location updates are allowed only for active rides." },
      { status: 400 }
    );
  }

  const latest = await prisma.location.findFirst({
    where: { rideId: id },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });

  if (latest) {
    const elapsed = Date.now() - latest.timestamp.getTime();
    if (elapsed < MIN_UPDATE_INTERVAL_MS) {
      return Response.json(
        { error: "Too many updates. Please wait before sending another location." },
        { status: 429 }
      );
    }
  }

  const location = await prisma.location.create({
    data: {
      rideId: id,
      latitude,
      longitude,
    },
  });

  return Response.json({ location }, { status: 201 });
}
