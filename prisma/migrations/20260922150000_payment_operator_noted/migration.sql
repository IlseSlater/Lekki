-- Operate Continuity: owner noted a failed payment without changing money status.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "operatorNotedAt" TIMESTAMP(3);
