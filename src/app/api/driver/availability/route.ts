import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { isAvailable, currentPassengerComposition } = body;

  const data: Record<string, unknown> = {};
  if (typeof isAvailable === "boolean") data.isAvailable = isAvailable;
  if (currentPassengerComposition) data.currentPassengerComposition = currentPassengerComposition;

  const driver = await prisma.driver.update({
    where: { userId: session.user.id },
    data,
  });

  // Also update composition on all OPEN/ONGOING rides
  if (currentPassengerComposition) {
    await prisma.ride.updateMany({
      where: {
        driverId: driver.id,
        status: { in: ["OPEN", "BOOKED", "ONGOING"] },
      },
      data: { currentPassengerComposition },
    });
  }

  return Response.json({ driver });
}
