-- A retry from the phone returns the first order or payment instead of creating a second.
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_sessionId_idempotencyKey_key"
  ON "Transaction"("sessionId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "Payment_sessionId_idempotencyKey_idx"
  ON "Payment"("sessionId", "idempotencyKey");
