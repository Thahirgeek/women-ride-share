import { auth } from "@/lib/auth";
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
  const sessionPhone =
    typeof (session.user as { phone?: string | null }).phone === "string"
      ? (session.user as { phone?: string | null }).phone?.trim() ?? ""
      : "";
  const normalizedPhone =
    typeof phone === "string" && phone.trim().length > 0
      ? phone.trim()
      : sessionPhone;

  try {
    if (!normalizedPhone) {
      return Response.json({ error: "Phone is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role === "DRIVER") {
      const normalizedLicenseNumber =
        typeof licenseNumber === "string" ? licenseNumber.trim() : "";
      const normalizedRegistrationNumber =
        typeof registrationNumber === "string" ? registrationNumber.trim() : "";
      const normalizedModel = typeof model === "string" ? model.trim() : "";
      const normalizedColor = typeof color === "string" ? color.trim() : "";
      const normalizedSeatsAvailable = Number.parseInt(String(seatsAvailable), 10);

      if (!normalizedLicenseNumber) {
        return Response.json({ error: "License number is required." }, { status: 400 });
      }

      if (!vehicleType || typeof vehicleType !== "string") {
        return Response.json({ error: "Vehicle type is required." }, { status: 400 });
      }

      if (!normalizedRegistrationNumber || !normalizedModel || !normalizedColor) {
        return Response.json(
          { error: "Registration number, model, and color are required." },
          { status: 400 }
        );
      }

      if (!Number.isFinite(normalizedSeatsAvailable) || normalizedSeatsAvailable < 1) {
        return Response.json(
          { error: "Seats available must be at least 1." },
          { status: 400 }
        );
      }
    }

    // Update user phone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: normalizedPhone },
    });

    if (user?.role === "DRIVER") {
      const normalizedLicenseNumber =
        typeof licenseNumber === "string" ? licenseNumber.trim() : "";
      const normalizedRegistrationNumber =
        typeof registrationNumber === "string" ? registrationNumber.trim() : "";
      const normalizedModel = typeof model === "string" ? model.trim() : "";
      const normalizedColor = typeof color === "string" ? color.trim() : "";
      const normalizedSeatsAvailable = Number.parseInt(String(seatsAvailable), 10);

      const driver = await prisma.driver.upsert({
        where: { userId: session.user.id },
        update: {
          licenseNumber: normalizedLicenseNumber,
        },
        create: {
          userId: session.user.id,
          licenseNumber: normalizedLicenseNumber,
          verificationStatus: "UNVERIFIED",
          isVerified: false,
        },
      });

      // Create vehicle
      await prisma.vehicle.upsert({
        where: { driverId: driver.id },
        update: {
          vehicleType,
          registrationNumber: normalizedRegistrationNumber,
          model: normalizedModel,
          color: normalizedColor,
          seatsAvailable: normalizedSeatsAvailable,
        },
        create: {
          driverId: driver.id,
          vehicleType,
          registrationNumber: normalizedRegistrationNumber,
          model: normalizedModel,
          color: normalizedColor,
          seatsAvailable: normalizedSeatsAvailable,
        },
      });
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
