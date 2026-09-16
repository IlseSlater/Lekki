-- P0-2: tenant-scoped payment installs — org+venue required, one row per venue.
DELETE FROM "PaymentConnectorInstall"
WHERE "organisationId" IS NULL OR "venueId" IS NULL;

-- Keep the newest row per (organisationId, venueId); demote older duplicates.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "organisationId", "venueId"
           ORDER BY "updatedAt" DESC
         ) AS rn
  FROM "PaymentConnectorInstall"
)
DELETE FROM "PaymentConnectorInstall"
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

ALTER TABLE "PaymentConnectorInstall"
  ALTER COLUMN "organisationId" SET NOT NULL,
  ALTER COLUMN "venueId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentConnectorInstall_organisationId_venueId_key"
  ON "PaymentConnectorInstall"("organisationId", "venueId");
