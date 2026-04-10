-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "dropLat" DOUBLE PRECISION,
ADD COLUMN     "dropLng" DOUBLE PRECISION,
ADD COLUMN     "dropPlaceId" TEXT,
ADD COLUMN     "pickupLat" DOUBLE PRECISION,
ADD COLUMN     "pickupLng" DOUBLE PRECISION,
ADD COLUMN     "pickupPlaceId" TEXT;

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "destinationLat" DOUBLE PRECISION,
ADD COLUMN     "destinationLng" DOUBLE PRECISION,
ADD COLUMN     "destinationPlaceId" TEXT,
ADD COLUMN     "sourceLat" DOUBLE PRECISION,
ADD COLUMN     "sourceLng" DOUBLE PRECISION,
ADD COLUMN     "sourcePlaceId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_pickupPlaceId_idx" ON "Booking"("pickupPlaceId");

-- CreateIndex
CREATE INDEX "Booking_dropPlaceId_idx" ON "Booking"("dropPlaceId");

-- CreateIndex
CREATE INDEX "Ride_sourcePlaceId_idx" ON "Ride"("sourcePlaceId");

-- CreateIndex
CREATE INDEX "Ride_destinationPlaceId_idx" ON "Ride"("destinationPlaceId");
