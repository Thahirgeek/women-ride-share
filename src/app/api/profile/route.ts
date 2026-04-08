import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, phone, profileImage, vehicle } = body;

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (profileImage !== undefined) data.profileImage = profileImage;

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  // Update vehicle if driver
  if (vehicle) {
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });
    if (driver) {
      await prisma.vehicle.upsert({
        where: { driverId: driver.id },
        update: {
          vehicleType: vehicle.vehicleType,
          registrationNumber: vehicle.registrationNumber,
          model: vehicle.model,
          color: vehicle.color,
          seatsAvailable: parseInt(vehicle.seatsAvailable) || 4,
        },
        create: {
          driverId: driver.id,
          vehicleType: vehicle.vehicleType,
          registrationNumber: vehicle.registrationNumber,
          model: vehicle.model,
          color: vehicle.color,
          seatsAvailable: parseInt(vehicle.seatsAvailable) || 4,
        },
      });
    }
  }

  return Response.json({ success: true });
}
