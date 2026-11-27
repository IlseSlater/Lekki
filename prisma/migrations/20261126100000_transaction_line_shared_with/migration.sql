-- One dish, shared: guests who split a line. Empty means the line belongs to participantId (or nobody).
ALTER TABLE "TransactionLine" ADD COLUMN IF NOT EXISTS "sharedWith" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
