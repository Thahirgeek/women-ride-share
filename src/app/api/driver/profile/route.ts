import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id },
    include: {
      vehicle: true,
      rides: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { rides: true } },
    },
  });

  return Response.json({ driver });
}
