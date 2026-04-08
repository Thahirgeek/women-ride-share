import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { ride: true },
  });
  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });

  if (status === "CONFIRMED") {
    // Driver accepting — decrement available seats
    await prisma.ride.update({
      where: { id: booking.rideId },
      data: {
        availableSeats: { decrement: booking.seatCount },
        status: "BOOKED",
      },
    });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return Response.json({ booking: updated });
}
