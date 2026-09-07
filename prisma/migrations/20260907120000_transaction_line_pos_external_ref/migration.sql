-- POS hybrid ingress: lock external line identity on TransactionLine.
-- Money stays Decimal major units (same as existing unitPrice / Transaction.total).
-- catalogueItemId becomes nullable for unmapped POS SKUs (Operate queue).

ALTER TABLE "TransactionLine"
  ALTER COLUMN "catalogueItemId" DROP NOT NULL;

ALTER TABLE "TransactionLine"
  ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS "externalRef" TEXT,
  ADD COLUMN IF NOT EXISTS "externalCheckId" TEXT;

-- Idempotency for POS webhook retries (Postgres allows many NULLs under UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS "TransactionLine_externalRef_key"
  ON "TransactionLine" ("externalRef");

CREATE INDEX IF NOT EXISTS "TransactionLine_externalCheckId_idx"
  ON "TransactionLine" ("externalCheckId");
