-- POS externalRef is unique per venue (Pilot line ids are per-site), not globally.

ALTER TABLE "TransactionLine" ADD COLUMN IF NOT EXISTS "venueId" TEXT;

UPDATE "TransactionLine" AS tl
SET "venueId" = s."venueId"
FROM "Transaction" AS t
JOIN "ExperienceSession" AS s ON s."id" = t."sessionId"
WHERE tl."transactionId" = t."id"
  AND tl."venueId" IS NULL
  AND tl."externalRef" IS NOT NULL;

DROP INDEX IF EXISTS "TransactionLine_externalRef_key";

CREATE UNIQUE INDEX IF NOT EXISTS "TransactionLine_venueId_externalRef_key"
  ON "TransactionLine"("venueId", "externalRef");

CREATE INDEX IF NOT EXISTS "TransactionLine_venueId_idx"
  ON "TransactionLine"("venueId");
