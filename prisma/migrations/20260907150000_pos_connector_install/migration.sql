-- Studio POS connector install (Pilot). Secrets stay in SecretsVaultEntry.

CREATE TABLE IF NOT EXISTS "PosConnectorInstall" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "connectorId" TEXT NOT NULL DEFAULT 'pilot',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "settlementOwner" TEXT NOT NULL DEFAULT 'lekki',
  "posOwnership" TEXT NOT NULL DEFAULT 'ledger',
  "apiKeySecretRef" TEXT,
  "webhookSecretRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PosConnectorInstall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PosConnectorInstall_venueId_connectorId_key"
  ON "PosConnectorInstall" ("venueId", "connectorId");

CREATE INDEX IF NOT EXISTS "PosConnectorInstall_organisationId_venueId_idx"
  ON "PosConnectorInstall" ("organisationId", "venueId");
