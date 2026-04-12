import { auth } from "@/lib/auth";
import {
  ensureChatEventListener,
  subscribeToChatEvents,
  type ChatEventPayload,
} from "@/lib/chat-events";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function formatSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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

  try {
    await ensureChatEventListener();
  } catch {
    return Response.json({ error: "Realtime chat is unavailable" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(formatSseEvent(event, data)));
      };

      const onChatEvent = (event: ChatEventPayload) => {
        if (event.bookingId !== bookingId) return;
        send(event.type, event);
      };

      const keepAlive = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 25000);

      const unsubscribe = subscribeToChatEvents(onChatEvent);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        request.signal.removeEventListener("abort", close);
        controller.close();
      };

      cleanup = close;
      request.signal.addEventListener("abort", close);
      send("connected", { bookingId });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}