import { auth } from "@/lib/auth";
import {
  canTransitionVerificationStatus,
  getNextVerificationStatus,
  isDriverVerifiedStatus,
  normalizeDriverVerificationAction,
} from "@/lib/driver-verification";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const REQUIRED_DOCUMENT_TYPES = [
  "LICENSE",
  "VEHICLE_REGISTRATION",
  "INSURANCE",
] as const;

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
  const action = normalizeDriverVerificationAction(body?.action);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!action) {
    return Response.json(
      { error: "Invalid action. Use REQUEST_REVIEW, APPROVE, or REVOKE." },
      { status: 400 }
    );
  }

  if (action === "REVOKE" && !reason) {
    return Response.json(
      { error: "A reason is required when revoking a driver." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const driver = await tx.driver.findUnique({ where: { id } });
    if (!driver) return null;

    if (!canTransitionVerificationStatus(driver.verificationStatus, action)) {
      return {
        error: `Cannot ${action} driver from ${driver.verificationStatus}.`,
        status: 400,
      };
    }

    const nextStatus = getNextVerificationStatus(action);

    let incompleteRequiredDocuments: {
      documentType: (typeof REQUIRED_DOCUMENT_TYPES)[number];
      status: "MISSING" | "PENDING" | "REJECTED";
    }[] = [];

    if (action === "APPROVE") {
      const latestDocuments = await tx.driverDocumentSubmission.findMany({
        where: {
          driverId: id,
          documentType: { in: [...REQUIRED_DOCUMENT_TYPES] },
        },
        orderBy: [{ submittedAt: "desc" }],
        select: {
          documentType: true,
          reviewStatus: true,
        },
      });

      const latestStatusByType = new Map<string, string>();
      for (const document of latestDocuments) {
        if (!latestStatusByType.has(document.documentType)) {
          latestStatusByType.set(document.documentType, document.reviewStatus);
        }
      }

      incompleteRequiredDocuments = REQUIRED_DOCUMENT_TYPES.filter(
        (documentType) => latestStatusByType.get(documentType) !== "APPROVED"
      ).map((documentType) => {
        const latestStatus = latestStatusByType.get(documentType);

        if (latestStatus === "PENDING" || latestStatus === "REJECTED") {
          return { documentType, status: latestStatus };
        }

        return { documentType, status: "MISSING" as const };
      });
    }

    const updated = await tx.driver.update({
      where: { id },
      data: {
        verificationStatus: nextStatus,
        verificationReason: reason || null,
        verificationUpdatedAt: now,
        verificationUpdatedBy: session.user.id,
        isVerified: isDriverVerifiedStatus(nextStatus),
      },
    });

    await tx.driverVerificationEvent.create({
      data: {
        driverId: id,
        fromStatus: driver.verificationStatus,
        toStatus: nextStatus,
        action,
        reason: reason || null,
        actorUserId: session.user.id,
      },
    });

    let cancelledOpenRides = 0;
    let cancelledFutureBookedRides = 0;
    let cancelledFutureBookings = 0;

    if (nextStatus === "REVOKED") {
      const cancelledOpen = await tx.ride.updateMany({
        where: {
          driverId: id,
          status: "OPEN",
        },
        data: { status: "CANCELLED" },
      });
      cancelledOpenRides = cancelledOpen.count;

      const futureBookedRideIds = (
        await tx.ride.findMany({
          where: {
            driverId: id,
            status: "BOOKED",
            scheduledAt: { gt: now },
          },
          select: { id: true },
        })
      ).map((ride) => ride.id);

      if (futureBookedRideIds.length > 0) {
        const cancelledBooked = await tx.ride.updateMany({
          where: { id: { in: futureBookedRideIds } },
          data: { status: "CANCELLED" },
        });
        cancelledFutureBookedRides = cancelledBooked.count;

        const cancelledBookings = await tx.booking.updateMany({
          where: {
            rideId: { in: futureBookedRideIds },
            status: { not: "CANCELLED" },
          },
          data: { status: "CANCELLED" },
        });
        cancelledFutureBookings = cancelledBookings.count;
      }
    }

    return {
      action,
      driver: updated,
      incompleteRequiredDocuments,
      cancelledOpenRides,
      cancelledFutureBookedRides,
      cancelledFutureBookings,
    };
  });

  if (!result) {
    return Response.json({ error: "Driver not found" }, { status: 404 });
  }

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result);
}
