import { auth } from "@/lib/auth";
import { publishChatEvent } from "@/lib/chat-events";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          passenger: { select: { userId: true } },
          ride: { include: { driver: { select: { userId: true } } } },
        },
      },
    },
  });

  if (!message) return Response.json({ error: "Message not found" }, { status: 404 });

  const userId = session.user.id;
  const isPassenger = message.booking.passenger.userId === userId;
  const isDriver = message.booking.ride.driver.userId === userId;

  if (!isPassenger && !isDriver) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (message.senderId === userId) {
    return Response.json({ message });
  }

  if (message.readAt) {
    return Response.json({ message });
  }

  const updated = await prisma.message.update({
    where: { id },
    data: { readAt: new Date() },
  });

  try {
    await publishChatEvent({
      type: "message-read",
      bookingId: message.bookingId,
      messageId: updated.id,
    });
  } catch (error) {
    console.error("Failed to publish message-read event", error);
  }

  return Response.json({ message: updated });
}
