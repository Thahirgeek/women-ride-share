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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const existing = await prisma.rating.findUnique({
    where: { id },
    include: {
      ride: { select: { status: true } },
    },
  });

  if (!existing) {
    return Response.json({ error: "Feedback not found" }, { status: 404 });
  }

  if (existing.raterId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.ride.status !== "COMPLETED") {
    return Response.json(
      { error: "Feedback can be edited only for completed rides" },
      { status: 400 }
    );
  }

  if (!canEditFeedback(existing.createdAt)) {
    return Response.json(
      {
        error: "Feedback edit window has expired.",
        editDeadline: getEditDeadline(existing.createdAt).toISOString(),
      },
      { status: 403 }
    );
  }

  const data: {
    score?: number;
    comment?: string | null;
    tags?: string[];
  } = {};

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "score")) {
    const score = normalizeScore(body?.score);

    if (score === null) {
      return Response.json(
        { error: "Score must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    data.score = score;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "comment")) {
    data.comment = normalizeComment(body?.comment);
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "tags")) {
    data.tags = normalizeTags(body?.tags);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No editable fields were provided" }, { status: 400 });
  }

  const rating = await prisma.rating.update({
    where: { id },
    data,
    select: {
      id: true,
      score: true,
      comment: true,
      tags: true,
      createdAt: true,
    },
  });

  return Response.json({
    rating,
    canEdit: canEditFeedback(rating.createdAt),
    editDeadline: getEditDeadline(rating.createdAt).toISOString(),
  });
}
