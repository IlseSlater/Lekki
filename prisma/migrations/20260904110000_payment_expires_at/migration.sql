-- Abandoned pending payments must expire so paidMinor and unique indexes release.

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Existing pending rows: give them a 15-minute window from creation.
UPDATE "Payment"
SET "expiresAt" = "createdAt" + INTERVAL '15 minutes'
WHERE status = 'pending' AND "expiresAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Payment_status_expiresAt_idx"
  ON "Payment" ("status", "expiresAt");
