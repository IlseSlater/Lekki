-- Venue workspace presentation fields + asset upload ledger.

ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "menuCoverUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "VenueAsset" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "originalName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VenueAsset_venueId_kind_idx"
  ON "VenueAsset" ("venueId", "kind");

CREATE INDEX IF NOT EXISTS "VenueAsset_organisationId_venueId_idx"
  ON "VenueAsset" ("organisationId", "venueId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VenueAsset_venueId_fkey'
  ) THEN
    ALTER TABLE "VenueAsset"
      ADD CONSTRAINT "VenueAsset_venueId_fkey"
      FOREIGN KEY ("venueId") REFERENCES "Venue"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
