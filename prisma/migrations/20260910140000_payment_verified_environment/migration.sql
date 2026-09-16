-- Persist which environment was last successfully verified (P1-5).
ALTER TABLE "PaymentConnectorInstall"
  ADD COLUMN IF NOT EXISTS "verifiedEnvironment" TEXT;
