import { auth } from "@/lib/auth";
import { uploadDriverVerificationDocument } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const VALID_DOCUMENT_TYPES = [
  "LICENSE",
  "VEHICLE_REGISTRATION",
  "INSURANCE",
  "OTHER",
] as const;

type DriverDocumentTypeInput = (typeof VALID_DOCUMENT_TYPES)[number];

function isDriverDocumentType(value: string): value is DriverDocumentTypeInput {
  return VALID_DOCUMENT_TYPES.includes(value as DriverDocumentTypeInput);
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

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

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "DRIVER") {
    return Response.json(
      { error: "Only drivers can submit verification documents." },
      { status: 403 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json(
      { error: "Invalid form payload. Submit multipart/form-data." },
      { status: 400 }
    );
  }

  const documentType =
    typeof formData.get("documentType") === "string"
      ? String(formData.get("documentType")).toUpperCase().trim()
      : "";
  const expiresAtRaw = formData.get("expiresAt");
  const expiresAt =
    typeof expiresAtRaw === "string" && expiresAtRaw.trim().length > 0
      ? expiresAtRaw.trim()
      : null;
  const file = formData.get("file");

  if (!isDriverDocumentType(documentType)) {
    return Response.json(
      { error: "Invalid documentType." },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required." }, { status: 400 });
  }

  if (file.size <= 0) {
    return Response.json({ error: "Uploaded file is empty." }, { status: 400 });
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return Response.json(
      { error: "Document exceeds 10 MB size limit." },
      { status: 400 }
    );
  }

  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return Response.json({ error: "expiresAt must be a valid date." }, { status: 400 });
  }

  const driver = await prisma.driver.upsert({
    where: { userId: session.user.id },
    update: {},
    create: {
      userId: session.user.id,
      isVerified: false,
      verificationStatus: "UNVERIFIED",
    },
    select: { id: true, verificationStatus: true },
  });

  let uploadData;
  try {
    uploadData = await uploadDriverVerificationDocument({
      userId: session.user.id,
      documentType,
      file,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload document to storage.",
      },
      { status: 500 }
    );
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const baseDocumentData = {
      driverId: driver.id,
      documentType,
      storageUrl: uploadData.storageUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    let document;
    try {
      document = await tx.driverDocumentSubmission.create({
        data: {
          ...baseDocumentData,
          storagePublicId: uploadData.storagePublicId,
          originalFileName: uploadData.originalFileName,
          mimeType: uploadData.mimeType,
          fileSizeBytes: uploadData.fileSizeBytes,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const runtimeClientIsStale =
        message.includes("Unknown argument `storagePublicId`") ||
        message.includes("Unknown argument `originalFileName`") ||
        message.includes("Unknown argument `mimeType`") ||
        message.includes("Unknown argument `fileSizeBytes`");

      if (!runtimeClientIsStale) {
        throw error;
      }

      document = await tx.driverDocumentSubmission.create({
        data: baseDocumentData,
      });
    }

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
