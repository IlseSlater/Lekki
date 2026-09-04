-- Catalogue hospitality fields (allergens, dietary, age gate). available already exists for 86.

ALTER TABLE "RestaurantCatalogItem"
  ADD COLUMN IF NOT EXISTS "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "dietaryTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "ageRestricted" BOOLEAN NOT NULL DEFAULT false;
