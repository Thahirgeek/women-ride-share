import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const VALID_REVIEW_STATUSES = new Set(["APPROVED", "REJECTED"]);

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; documentId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const reviewStatus =
    typeof body?.reviewStatus === "string"
      ? body.reviewStatus.toUpperCase()
      : "";
  const rejectionReason =
    typeof body?.rejectionReason === "string"
      ? body.rejectionReason.trim()
      : "";

  if (!VALID_REVIEW_STATUSES.has(reviewStatus)) {
    return Response.json(
      { error: "Invalid reviewStatus. Use APPROVED or REJECTED." },
      { status: 400 }
    );
  }

  if (reviewStatus === "REJECTED" && !rejectionReason) {
    return Response.json(
      { error: "rejectionReason is required for REJECTED documents." },
      { status: 400 }
    );
  }

  const { id, documentId } = await params;

  const document = await prisma.driverDocumentSubmission.findFirst({
    where: {
      id: documentId,
      driverId: id,
    },
    select: { id: true },
  });

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  const updatedDocument = await prisma.driverDocumentSubmission.update({
    where: { id: documentId },
    data: {
      reviewStatus,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
      rejectionReason: reviewStatus === "REJECTED" ? rejectionReason : null,
    },
  });

  return Response.json({ document: updatedDocument });
}
