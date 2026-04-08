import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// Valid transitions map
const validTransitions: Record<string, string[]> = {
  CREATED: ["OPEN"],
  OPEN: ["BOOKED", "CANCELLED"],
  BOOKED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED", "CANCELLED"],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return Response.json({ error: "Ride not found" }, { status: 404 });

  // Validate transition
  const allowed = validTransitions[ride.status];
  if (!allowed || !allowed.includes(status)) {
    return Response.json(
      { error: `Cannot transition from ${ride.status} to ${status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: { status },
  });

  return Response.json({ ride: updated });
}
