import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const VALID_STATUSES = [
  "UNVERIFIED",
  "PENDING_REVIEW",
  "VERIFIED",
  "REVOKED",
] as const;

type DriverVerificationStatusFilter = (typeof VALID_STATUSES)[number];

function isDriverVerificationStatusFilter(
  value: string
): value is DriverVerificationStatusFilter {
  return VALID_STATUSES.includes(value as DriverVerificationStatusFilter);
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = request.nextUrl;
  const driversOnly = url.searchParams.get("drivers");
  const verificationStatusFilter =
    url.searchParams.get("verificationStatus")?.trim().toUpperCase() ?? "";

  if (driversOnly) {
    const where =
      verificationStatusFilter &&
      isDriverVerificationStatusFilter(verificationStatusFilter)
        ? { verificationStatus: verificationStatusFilter }
        : undefined;

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { vehicleType: true, model: true } },
        documents: {
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            documentType: true,
            storageUrl: true,
            originalFileName: true,
            mimeType: true,
            fileSizeBytes: true,
            reviewStatus: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
          },
        },
        _count: {
          select: {
            documents: true,
            rides: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const pendingDocumentCounts = await prisma.driverDocumentSubmission.groupBy({
      by: ["driverId"],
      where: {
        driverId: { in: drivers.map((driver) => driver.id) },
        reviewStatus: "PENDING",
      },
      _count: { _all: true },
    });

    const pendingCountMap = new Map(
      pendingDocumentCounts.map((item) => [item.driverId, item._count._all])
    );

    return Response.json({
      drivers: drivers.map((driver) => ({
        ...driver,
        pendingDocumentCount: pendingCountMap.get(driver.id) ?? 0,
      })),
    });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ users });
}
