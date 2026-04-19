import { auth } from "@/lib/auth";
import { isDriverVerifiedStatus } from "@/lib/driver-verification";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { phone, licenseNumber, vehicleType, registrationNumber, model, color, seatsAvailable } = body;

  try {
    // Update user phone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone },
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (user?.role === "DRIVER") {
      // Create or update driver profile, moving first-time drivers into review queue.
      const existingDriver = await prisma.driver.findUnique({
        where: { userId: session.user.id },
        select: { id: true, verificationStatus: true },
      });

      const nextVerificationStatus =
        !existingDriver || existingDriver.verificationStatus === "UNVERIFIED"
          ? "PENDING_REVIEW"
          : existingDriver.verificationStatus;

      const driver = await prisma.driver.upsert({
        where: { userId: session.user.id },
        update: {
          licenseNumber,
          verificationStatus: nextVerificationStatus,
          verificationUpdatedAt: new Date(),
          verificationReason: null,
          isVerified: isDriverVerifiedStatus(nextVerificationStatus),
        },
        create: {
          userId: session.user.id,
          licenseNumber,
          verificationStatus: "PENDING_REVIEW",
          verificationUpdatedAt: new Date(),
          isVerified: false,
        },
      });

      if (!existingDriver || existingDriver.verificationStatus === "UNVERIFIED") {
        await prisma.driverVerificationEvent.create({
          data: {
            driverId: driver.id,
            fromStatus: existingDriver?.verificationStatus,
            toStatus: "PENDING_REVIEW",
            action: "REQUEST_REVIEW",
            reason: "Driver completed onboarding details",
            actorUserId: session.user.id,
          },
        });
      }

      // Create vehicle
      if (vehicleType) {
        await prisma.vehicle.upsert({
          where: { driverId: driver.id },
          update: {
            vehicleType,
            registrationNumber,
            model,
            color,
            seatsAvailable: seatsAvailable || 4,
          },
          create: {
            driverId: driver.id,
            vehicleType,
            registrationNumber,
            model,
            color,
            seatsAvailable: seatsAvailable || 4,
          },
        });
      }
    } else if (user?.role === "PASSENGER") {
      // Create passenger profile
      await prisma.passenger.upsert({
        where: { userId: session.user.id },
        update: {},
        create: {
          userId: session.user.id,
        },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return Response.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
