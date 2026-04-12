-- Add tags to rating feedback
ALTER TABLE "Rating"
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Enforce one feedback per ride rater/ratee combination
CREATE UNIQUE INDEX "Rating_rideId_raterId_rateeId_key"
ON "Rating"("rideId", "raterId", "rateeId");

-- Speed up driver feedback timeline lookups
CREATE INDEX "Rating_driverId_createdAt_idx"
ON "Rating"("driverId", "createdAt");
