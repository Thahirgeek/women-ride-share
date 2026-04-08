import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return Response.json({ error: "Driver not found" }, { status: 404 });

  const updated = await prisma.driver.update({
    where: { id },
    data: { isVerified: !driver.isVerified },
  });

  return Response.json({ driver: updated });
}
