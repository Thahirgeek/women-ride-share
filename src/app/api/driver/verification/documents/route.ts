import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const VALID_DOCUMENT_TYPES = new Set([
  "LICENSE",
  "VEHICLE_REGISTRATION",
  "INSURANCE",
  "OTHER",
]);

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!driver) {
    return Response.json({ error: "Driver profile not found" }, { status: 404 });
  }

  const documents = await prisma.driverDocumentSubmission.findMany({
    where: { driverId: driver.id },
    orderBy: { submittedAt: "desc" },
  });

  return Response.json({ documents });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const documentType =
    typeof body?.documentType === "string"
      ? body.documentType.toUpperCase()
      : "";
  const storageUrl =
    typeof body?.storageUrl === "string" ? body.storageUrl.trim() : "";
  const expiresAt = typeof body?.expiresAt === "string" ? body.expiresAt : null;

  if (!VALID_DOCUMENT_TYPES.has(documentType)) {
    return Response.json(
      { error: "Invalid documentType." },
      { status: 400 }
    );
  }

  if (!storageUrl) {
    return Response.json({ error: "storageUrl is required." }, { status: 400 });
  }

  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return Response.json({ error: "expiresAt must be a valid date." }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id },
    select: { id: true, verificationStatus: true },
  });

  if (!driver) {
    return Response.json({ error: "Driver profile not found" }, { status: 404 });
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const document = await tx.driverDocumentSubmission.create({
      data: {
        driverId: driver.id,
        documentType,
        storageUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    if (driver.verificationStatus === "UNVERIFIED") {
      await tx.driver.update({
        where: { id: driver.id },
        data: {
          verificationStatus: "PENDING_REVIEW",
          verificationReason: null,
          verificationUpdatedAt: now,
          verificationUpdatedBy: session.user.id,
          isVerified: false,
        },
      });

      await tx.driverVerificationEvent.create({
        data: {
          driverId: driver.id,
          fromStatus: "UNVERIFIED",
          toStatus: "PENDING_REVIEW",
          action: "REQUEST_REVIEW",
          reason: "Driver submitted verification documents",
          actorUserId: session.user.id,
        },
      });
    }

    return document;
  });

  return Response.json({ document: result }, { status: 201 });
}
