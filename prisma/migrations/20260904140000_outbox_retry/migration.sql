-- Outbox retry / dead-letter columns for durable publish.

ALTER TABLE "OutboxMessage"
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deadLetteredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastError" TEXT;

CREATE INDEX IF NOT EXISTS "OutboxMessage_due_idx"
  ON "OutboxMessage" ("createdAt")
  WHERE "publishedAt" IS NULL AND "deadLetteredAt" IS NULL;
