import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

type VerificationAction = "VERIFY" | "REVOKE";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action as VerificationAction | undefined;
  if (action !== "VERIFY" && action !== "REVOKE") {
    return Response.json(
      { error: "Invalid action. Use VERIFY or REVOKE." },
      { status: 400 }
    );
  }

  const { id } = await params;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return Response.json({ error: "Driver not found" }, { status: 404 });

  if (action === "VERIFY") {
    const updated = await prisma.driver.update({
      where: { id },
      data: { isVerified: true },
    });

    return Response.json({
      action,
      driver: updated,
      cancelledOpenRides: 0,
    });
  }

  const [updated, cancelled] = await prisma.$transaction([
    prisma.driver.update({
      where: { id },
      data: { isVerified: false },
    }),
    prisma.ride.updateMany({
      where: {
        driverId: id,
        status: "OPEN",
      },
      data: { status: "CANCELLED" },
    }),
  ]);

  return Response.json({
    action,
    driver: updated,
    cancelledOpenRides: cancelled.count,
  });
}
