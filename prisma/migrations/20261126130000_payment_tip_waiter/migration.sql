-- Each tip belongs to the waiter who had the table when it was paid.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "tipWaiterId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "tipWaiterName" TEXT;
CREATE INDEX IF NOT EXISTS "Payment_tipWaiterId_createdAt_idx" ON "Payment"("tipWaiterId", "createdAt");
