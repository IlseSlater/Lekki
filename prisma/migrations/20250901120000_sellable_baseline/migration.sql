-- Sellable LEOS baseline — Decimal money, participant secrets, venue guest design

-- SessionParticipant: resume secret + depart tracking
ALTER TABLE "SessionParticipant" ADD COLUMN IF NOT EXISTS "participantSecret" TEXT;
ALTER TABLE "SessionParticipant" ADD COLUMN IF NOT EXISTS "departedAt" TIMESTAMP(3);
ALTER TABLE "SessionParticipant" ADD COLUMN IF NOT EXISTS "equalSplitOptIn" BOOLEAN NOT NULL DEFAULT false;
UPDATE "SessionParticipant" SET "participantSecret" = 'sec_' || "id" WHERE "participantSecret" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "SessionParticipant_participantSecret_key" ON "SessionParticipant"("participantSecret");

-- Venue guest design + locale
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg';
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'ZAR';
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "guestDesignJson" JSONB;

-- Staff active flag
ALTER TABLE "StaffMember" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- TransactionLine notes + selections
ALTER TABLE "TransactionLine" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "TransactionLine" ADD COLUMN IF NOT EXISTS "selectionsJson" JSONB;

-- Catalogue availability
ALTER TABLE "RestaurantCatalogItem" ADD COLUMN IF NOT EXISTS "available" BOOLEAN NOT NULL DEFAULT true;

-- Money columns: Float → Decimal(12,2)
ALTER TABLE "Transaction" ALTER COLUMN "total" TYPE DECIMAL(12,2) USING ROUND("total"::numeric, 2);
ALTER TABLE "TransactionLine" ALTER COLUMN "unitPrice" TYPE DECIMAL(12,2) USING ROUND("unitPrice"::numeric, 2);
ALTER TABLE "Payment" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
ALTER TABLE "Payment" ALTER COLUMN "tipAmount" TYPE DECIMAL(12,2) USING ROUND("tipAmount"::numeric, 2);
ALTER TABLE "RestaurantCatalogItem" ALTER COLUMN "unitPrice" TYPE DECIMAL(12,2) USING ROUND("unitPrice"::numeric, 2);
