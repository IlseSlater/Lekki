-- POS hybrid: venue-scoped place + SKU maps so Pilot table/SKU ids never collide across tenants.
-- IDs are application-assigned (same convention as PhysicalContext / ExperienceSession).

CREATE TABLE IF NOT EXISTS "PosPlaceMapping" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "physicalContextId" TEXT NOT NULL,
  "externalPlaceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PosPlaceMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PosPlaceMapping_physicalContextId_key"
  ON "PosPlaceMapping" ("physicalContextId");

CREATE UNIQUE INDEX IF NOT EXISTS "PosPlaceMapping_venueId_externalPlaceId_key"
  ON "PosPlaceMapping" ("venueId", "externalPlaceId");

CREATE INDEX IF NOT EXISTS "PosPlaceMapping_venueId_idx"
  ON "PosPlaceMapping" ("venueId");

ALTER TABLE "PosPlaceMapping"
  ADD CONSTRAINT "PosPlaceMapping_physicalContextId_fkey"
  FOREIGN KEY ("physicalContextId") REFERENCES "PhysicalContext"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PosSkuMapping" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "catalogueItemId" TEXT NOT NULL,
  "externalSkuId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PosSkuMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PosSkuMapping_catalogueItemId_key"
  ON "PosSkuMapping" ("catalogueItemId");

CREATE UNIQUE INDEX IF NOT EXISTS "PosSkuMapping_venueId_externalSkuId_key"
  ON "PosSkuMapping" ("venueId", "externalSkuId");

CREATE INDEX IF NOT EXISTS "PosSkuMapping_venueId_idx"
  ON "PosSkuMapping" ("venueId");
