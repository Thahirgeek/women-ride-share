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
      documents: {
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          documentType: true,
          reviewStatus: true,
          submittedAt: true,
          rejectionReason: true,
        },
      },
      rides: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { rides: true, documents: true } },
    },
  });

  if (!driver) {
    return Response.json({ driver: null });
  }

  const [summary, recentFeedback] = await Promise.all([
    prisma.rating.aggregate({
      where: {
        driverId: driver.id,
        passengerId: { not: null },
      },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.rating.findMany({
      where: {
        driverId: driver.id,
        passengerId: { not: null },
        comment: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        score: true,
        comment: true,
        tags: true,
        createdAt: true,
        rater: { select: { name: true } },
      },
    }),
  ]);

  return Response.json({
    driver: {
      ...driver,
      ratingSummary: {
        averageScore:
          typeof summary._avg.score === "number"
            ? Math.round(summary._avg.score * 10) / 10
            : null,
        totalRatings: summary._count._all,
      },
      recentFeedback,
    },
  });
}
