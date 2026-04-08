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

  try {
    // Update user phone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone },
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (user?.role === "DRIVER") {
      // Create driver profile
      const driver = await prisma.driver.upsert({
        where: { userId: session.user.id },
        update: { licenseNumber },
        create: {
          userId: session.user.id,
          licenseNumber,
        },
      });

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
