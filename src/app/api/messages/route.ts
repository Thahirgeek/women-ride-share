import { auth } from "@/lib/auth";
import { publishChatEvent } from "@/lib/chat-events";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function getBookingParticipantContext(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      passenger: { select: { userId: true } },
      ride: { include: { driver: { select: { userId: true } } } },
    },
  });

  if (!booking) return { booking: null, isPassenger: false, isDriver: false };

  const isPassenger = booking.passenger.userId === userId;
  const isDriver = booking.ride.driver.userId === userId;

  return { booking, isPassenger, isDriver };
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return Response.json({ error: "bookingId is required" }, { status: 400 });
  }

  const { booking, isPassenger, isDriver } = await getBookingParticipantContext(
    bookingId,
    session.user.id
  );

  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (!isPassenger && !isDriver) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status === "PENDING") {
    return Response.json(
      { error: "Chat is available only after booking confirmation." },
      { status: 403 }
    );
  }

  const messages = await prisma.message.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      content: true,
      readAt: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  });

  const unreadCount = await prisma.message.count({
    where: {
      bookingId,
      senderId: { not: session.user.id },
      readAt: null,
    },
  });

  return Response.json({ messages, unreadCount });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const bookingId = body?.bookingId as string | undefined;
  const rawContent = body?.content as string | undefined;

  if (!bookingId || typeof bookingId !== "string") {
    return Response.json({ error: "bookingId is required" }, { status: 400 });
  }

  const content = typeof rawContent === "string" ? rawContent.trim() : "";
  if (!content) {
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (content.length > 1000) {
    return Response.json(
      { error: "Message is too long (max 1000 characters)" },
      { status: 400 }
    );
  }

  const { booking, isPassenger, isDriver } = await getBookingParticipantContext(
    bookingId,
    session.user.id
  );

  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (!isPassenger && !isDriver) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "CONFIRMED") {
    return Response.json(
      { error: "Chat is available only for confirmed bookings." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      bookingId,
      senderId: session.user.id,
      content,
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      readAt: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  });

  try {
    await publishChatEvent({
      type: "message-created",
      bookingId,
      messageId: message.id,
    });
  } catch (error) {
    console.error("Failed to publish message-created event", error);
  }

  return Response.json({ message }, { status: 201 });
}
