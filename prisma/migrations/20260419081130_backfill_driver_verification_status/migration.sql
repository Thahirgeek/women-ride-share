UPDATE "Driver"
SET
  "verificationStatus" = CASE
    WHEN "isVerified" THEN 'VERIFIED'::"DriverVerificationStatus"
    ELSE 'PENDING_REVIEW'::"DriverVerificationStatus"
  END,
  "verificationUpdatedAt" = COALESCE("verificationUpdatedAt", "updatedAt")
WHERE "verificationStatus" = 'UNVERIFIED';

INSERT INTO "DriverVerificationEvent" (
  "id",
  "driverId",
  "fromStatus",
  "toStatus",
  "action",
  "reason",
  "actorUserId",
  "createdAt"
)
SELECT
  'legacy_status_backfill_' || d."id",
  d."id",
  NULL,
  d."verificationStatus",
  CASE
    WHEN d."verificationStatus" = 'VERIFIED' THEN 'LEGACY_VERIFY_SYNC'
    ELSE 'LEGACY_REVIEW_QUEUE_SYNC'
  END,
  'Backfilled from legacy isVerified during migration',
  NULL,
  NOW()
FROM "Driver" d
WHERE NOT EXISTS (
  SELECT 1
  FROM "DriverVerificationEvent" e
  WHERE e."driverId" = d."id"
);
