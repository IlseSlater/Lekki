-- Menu hours, pause, busy minutes, and hold-and-fire live with the venue.
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "kitchenPaceJson" JSONB;
