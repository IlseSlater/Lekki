-- A manager can reply once to a guest's private note.
ALTER TABLE "GuestNote" ADD COLUMN IF NOT EXISTS "replyBody" TEXT;
ALTER TABLE "GuestNote" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);
ALTER TABLE "GuestNote" ADD COLUMN IF NOT EXISTS "repliedByName" TEXT;
