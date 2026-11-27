-- A guest tells the manager something privately after paying.
CREATE TABLE IF NOT EXISTS "GuestNote" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT,
    "placeCode" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GuestNote_organisationId_createdAt_idx" ON "GuestNote"("organisationId", "createdAt");
CREATE INDEX IF NOT EXISTS "GuestNote_sessionId_idx" ON "GuestNote"("sessionId");
