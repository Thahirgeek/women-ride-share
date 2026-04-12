import { auth } from "@/lib/auth";
import {
  canEditFeedback,
  getEditDeadline,
  normalizeComment,
  normalizeScore,
  normalizeTags,
} from "@/lib/feedback";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

async function getRidePassengerContext(rideId: string, userId: string) {
  const passenger = await prisma.passenger.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!passenger) {
    return {
      passenger: null,
      booking: null,
    };
  }

  const booking = await prisma.booking.findFirst({
    where: {
      rideId,
      passengerId: passenger.id,
      status: { not: "CANCELLED" },
    },
    include: {
      ride: {
        include: {
          driver: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return {
    passenger,
    booking,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rideId = request.nextUrl.searchParams.get("rideId")?.trim();
  if (!rideId) {
    return Response.json({ error: "rideId is required" }, { status: 400 });
  }

  const { passenger, booking } = await getRidePassengerContext(rideId, session.user.id);

  if (!passenger || !booking) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rating = await prisma.rating.findFirst({
    where: {
      rideId,
      raterId: session.user.id,
      rateeId: booking.ride.driver.userId,
    },
    select: {
      id: true,
      score: true,
      comment: true,
      tags: true,
      createdAt: true,
    },
  });

  const ratingSummary = await prisma.rating.aggregate({
    where: {
      driverId: booking.ride.driverId,
      passengerId: { not: null },
    },
    _avg: { score: true },
    _count: { _all: true },
  });

  return Response.json({
    ride: {
      id: booking.ride.id,
      source: booking.ride.source,
      destination: booking.ride.destination,
      status: booking.ride.status,
      scheduledAt: booking.ride.scheduledAt,
    },
    driver: {
      id: booking.ride.driver.id,
      userId: booking.ride.driver.userId,
      name: booking.ride.driver.user.name,
      ratingSummary: {
        averageScore:
          typeof ratingSummary._avg.score === "number"
            ? Math.round(ratingSummary._avg.score * 10) / 10
            : null,
        totalRatings: ratingSummary._count._all,
      },
    },
    rating: rating
      ? {
          ...rating,
          canEdit: canEditFeedback(rating.createdAt),
          editDeadline: getEditDeadline(rating.createdAt).toISOString(),
        }
      : null,
    canSubmit: booking.ride.status === "COMPLETED",
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rideId = typeof body?.rideId === "string" ? body.rideId : "";
  const score = normalizeScore(body?.score);
  const comment = normalizeComment(body?.comment);
  const tags = normalizeTags(body?.tags);

  if (!rideId) {
    return Response.json({ error: "rideId is required" }, { status: 400 });
  }

  if (score === null) {
    return Response.json({ error: "Score must be an integer between 1 and 5" }, { status: 400 });
  }

  const { passenger, booking } = await getRidePassengerContext(rideId, session.user.id);

  if (!passenger || !booking) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "CONFIRMED") {
    return Response.json({ error: "Only confirmed bookings can be rated" }, { status: 400 });
  }

  if (booking.ride.status !== "COMPLETED") {
    return Response.json({ error: "Feedback can be submitted only after ride completion" }, { status: 400 });
  }

  const existing = await prisma.rating.findFirst({
    where: {
      rideId,
      raterId: session.user.id,
      rateeId: booking.ride.driver.userId,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  if (existing) {
    return Response.json(
      {
        error: "Feedback already submitted for this ride.",
        ratingId: existing.id,
        canEdit: canEditFeedback(existing.createdAt),
        editDeadline: getEditDeadline(existing.createdAt).toISOString(),
      },
      { status: 409 }
    );
  }

  const rating = await prisma.rating.create({
    data: {
      rideId,
      raterId: session.user.id,
      rateeId: booking.ride.driver.userId,
      driverId: booking.ride.driverId,
      passengerId: passenger.id,
      score,
      comment,
      tags,
    },
    select: {
      id: true,
      score: true,
      comment: true,
      tags: true,
      createdAt: true,
    },
  });

  return Response.json({ rating }, { status: 201 });
}
