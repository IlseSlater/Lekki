-- Row 5: session-wide payment cap (not per-Transaction — remaining is visit-wide).

ALTER TABLE "ExperienceSession" ADD COLUMN IF NOT EXISTS "billMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExperienceSession" ADD COLUMN IF NOT EXISTS "paidMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExperienceSession" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

-- Backfill bill from committed/settled transaction Decimal totals → minor units.
UPDATE "ExperienceSession" AS s
SET "billMinor" = COALESCE((
  SELECT ROUND(SUM(t."total") * 100)::integer
  FROM "Transaction" AS t
  WHERE t."sessionId" = s.id
    AND t.status IN ('committed', 'settled')
), 0);

-- Backfill paid from completed payments (amount − tip) → minor units.
UPDATE "ExperienceSession" AS s
SET "paidMinor" = COALESCE((
  SELECT ROUND(SUM(p."amount" - COALESCE(p."tipAmount", 0)) * 100)::integer
  FROM "Payment" AS p
  WHERE p."sessionId" = s.id
    AND p.status IN ('completed', 'settled')
), 0);

-- One pending visit payment per session (Bob+Carol mine must still coexist).
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_pending_visit_session_uidx"
  ON "Payment" ("sessionId")
  WHERE status = 'pending' AND scope = 'visit';

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_pending_mine_session_participant_uidx"
  ON "Payment" ("sessionId", "participantId")
  WHERE status = 'pending' AND scope = 'mine' AND "participantId" IS NOT NULL;
