-- The waiter who has a table, and the phones that hear when food is ready.
ALTER TABLE "ExperienceSession" ADD COLUMN IF NOT EXISTS "waiterId" TEXT;
ALTER TABLE "ExperienceSession" ADD COLUMN IF NOT EXISTS "waiterName" TEXT;

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_organisationId_idx" ON "PushSubscription"("organisationId");
CREATE INDEX IF NOT EXISTS "PushSubscription_staffMemberId_idx" ON "PushSubscription"("staffMemberId");
