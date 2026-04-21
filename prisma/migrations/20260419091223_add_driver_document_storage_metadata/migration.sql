-- AlterTable
ALTER TABLE "DriverDocumentSubmission" ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "originalFileName" TEXT,
ADD COLUMN     "storagePublicId" TEXT;
