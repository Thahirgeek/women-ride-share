-- CreateEnum
CREATE TYPE "DriverVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DriverDocumentType" AS ENUM ('LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverDocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "verificationReason" TEXT,
ADD COLUMN     "verificationStatus" "DriverVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verificationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "verificationUpdatedBy" TEXT;

-- CreateTable
CREATE TABLE "DriverVerificationEvent" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fromStatus" "DriverVerificationStatus",
    "toStatus" "DriverVerificationStatus" NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverVerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocumentSubmission" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "documentType" "DriverDocumentType" NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "reviewStatus" "DriverDocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocumentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverVerificationEvent_driverId_createdAt_idx" ON "DriverVerificationEvent"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverDocumentSubmission_driverId_reviewStatus_idx" ON "DriverDocumentSubmission"("driverId", "reviewStatus");

-- CreateIndex
CREATE INDEX "DriverDocumentSubmission_driverId_submittedAt_idx" ON "DriverDocumentSubmission"("driverId", "submittedAt");

-- AddForeignKey
ALTER TABLE "DriverVerificationEvent" ADD CONSTRAINT "DriverVerificationEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocumentSubmission" ADD CONSTRAINT "DriverDocumentSubmission_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
