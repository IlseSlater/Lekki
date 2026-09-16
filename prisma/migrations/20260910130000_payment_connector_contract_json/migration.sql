-- Connector contract: move PayFast-shaped columns into generic JSON maps.
ALTER TABLE "PaymentConnectorInstall"
  ADD COLUMN IF NOT EXISTS "configJson" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "vaultRefsJson" JSONB NOT NULL DEFAULT '{}';

UPDATE "PaymentConnectorInstall"
SET
  "configJson" = COALESCE("configJson", '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
      'merchantId', "merchantId",
      'businessName', "businessName",
      'merchantStatus', "merchantStatus",
      'country', "country",
      'currency', "currency",
      'routingStrategy', "routingStrategy"
    )
  ),
  "vaultRefsJson" = COALESCE("vaultRefsJson", '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
      'merchantKey', "merchantKeySecretRef",
      'passphrase', "passphraseSecretRef"
    )
  );

ALTER TABLE "PaymentConnectorInstall"
  DROP COLUMN IF EXISTS "merchantId",
  DROP COLUMN IF EXISTS "merchantKey",
  DROP COLUMN IF EXISTS "passphrase",
  DROP COLUMN IF EXISTS "merchantKeySecretRef",
  DROP COLUMN IF EXISTS "passphraseSecretRef";
