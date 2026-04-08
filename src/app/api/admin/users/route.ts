import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = request.nextUrl;
  const driversOnly = url.searchParams.get("drivers");

  if (driversOnly) {
    const drivers = await prisma.driver.findMany({
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { vehicleType: true, model: true } },
      },
    });
    return Response.json({ drivers });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ users });
}
