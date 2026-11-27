-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menuBrandEnabled" BOOLEAN NOT NULL DEFAULT false,
    "brandColour" TEXT NOT NULL DEFAULT '#d7a14a',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "menuCoverUrl" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "guestDesignJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueAsset" (
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

-- CreateTable
CREATE TABLE "PhysicalContext" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "activeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosPlaceMapping" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "physicalContextId" TEXT NOT NULL,
    "externalPlaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosPlaceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSkuMapping" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "catalogueItemId" TEXT NOT NULL,
    "externalSkuId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosSkuMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosConnectorInstall" (
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

-- CreateTable
CREATE TABLE "EntryToken" (
    "token" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "physicalContextId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "profileVersion" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EntryToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "phoneHash" TEXT,
    "consentGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityConsent" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),

    CONSTRAINT "IdentityConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "permissions" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDevice" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastStaffId" TEXT,
    "lastStaffName" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceSession" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "physicalContextId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "profileVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "billMinor" INTEGER NOT NULL DEFAULT 0,
    "paidMinor" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExperienceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "identityId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "participantSecret" TEXT,
    "departedAt" TIMESTAMP(3),
    "equalSplitOptIn" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLine" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "venueId" TEXT,
    "catalogueItemId" TEXT,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "routingTags" TEXT[],
    "selectionsJson" JSONB,
    "notes" TEXT,
    "participantId" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'guest',
    "externalRef" TEXT,
    "externalCheckId" TEXT,

    CONSTRAINT "TransactionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fulfilment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fulfilment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfilmentLine" (
    "id" TEXT NOT NULL,
    "fulfilmentId" TEXT NOT NULL,
    "transactionLineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stationId" TEXT NOT NULL,

    CONSTRAINT "FulfilmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "tipAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "scope" TEXT NOT NULL DEFAULT 'visit',
    "participantId" TEXT,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxMessage" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "envelope" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretsVaultEntry" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "secretRef" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "keyVersion" TEXT NOT NULL DEFAULT 'v1',
    "cipherText" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretsVaultEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretsVaultAudit" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "secretRef" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretsVaultAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantCatalogItem" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "routingTags" TEXT[],
    "category" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ageRestricted" BOOLEAN NOT NULL DEFAULT false,
    "choiceGroups" JSONB,

    CONSTRAINT "RestaurantCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistanceRequest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AssistanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConnectorInstall" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "verifiedEnvironment" TEXT,
    "configJson" JSONB NOT NULL DEFAULT '{}',
    "vaultRefsJson" JSONB NOT NULL DEFAULT '{}',
    "businessName" TEXT,
    "merchantStatus" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "settlementJson" JSONB,
    "routingStrategy" TEXT,
    "step" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentConnectorInstall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VenueAsset_venueId_kind_idx" ON "VenueAsset"("venueId", "kind");

-- CreateIndex
CREATE INDEX "VenueAsset_organisationId_venueId_idx" ON "VenueAsset"("organisationId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "PosPlaceMapping_physicalContextId_key" ON "PosPlaceMapping"("physicalContextId");

-- CreateIndex
CREATE INDEX "PosPlaceMapping_venueId_idx" ON "PosPlaceMapping"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "PosPlaceMapping_venueId_externalPlaceId_key" ON "PosPlaceMapping"("venueId", "externalPlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "PosSkuMapping_catalogueItemId_key" ON "PosSkuMapping"("catalogueItemId");

-- CreateIndex
CREATE INDEX "PosSkuMapping_venueId_idx" ON "PosSkuMapping"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "PosSkuMapping_venueId_externalSkuId_key" ON "PosSkuMapping"("venueId", "externalSkuId");

-- CreateIndex
CREATE INDEX "PosConnectorInstall_organisationId_venueId_idx" ON "PosConnectorInstall"("organisationId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "PosConnectorInstall_venueId_connectorId_key" ON "PosConnectorInstall"("venueId", "connectorId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityConsent_identityId_organisationId_key" ON "IdentityConsent"("identityId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_email_key" ON "StaffMember"("email");

-- CreateIndex
CREATE INDEX "StaffSession_organisationId_idx" ON "StaffSession"("organisationId");

-- CreateIndex
CREATE INDEX "StaffSession_staffMemberId_idx" ON "StaffSession"("staffMemberId");

-- CreateIndex
CREATE INDEX "StaffDevice_organisationId_idx" ON "StaffDevice"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDevice_organisationId_label_key" ON "StaffDevice"("organisationId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_participantSecret_key" ON "SessionParticipant"("participantSecret");

-- CreateIndex
CREATE INDEX "TransactionLine_externalCheckId_idx" ON "TransactionLine"("externalCheckId");

-- CreateIndex
CREATE INDEX "TransactionLine_venueId_idx" ON "TransactionLine"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionLine_venueId_externalRef_key" ON "TransactionLine"("venueId", "externalRef");

-- CreateIndex
CREATE INDEX "Payment_status_expiresAt_idx" ON "Payment"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecretsVaultEntry_secretRef_key" ON "SecretsVaultEntry"("secretRef");

-- CreateIndex
CREATE INDEX "SecretsVaultEntry_organisationId_venueId_connectorId_idx" ON "SecretsVaultEntry"("organisationId", "venueId", "connectorId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretsVaultEntry_organisationId_venueId_connectorId_secret_key" ON "SecretsVaultEntry"("organisationId", "venueId", "connectorId", "secretKey");

-- CreateIndex
CREATE INDEX "SecretsVaultAudit_organisationId_venueId_connectorId_create_idx" ON "SecretsVaultAudit"("organisationId", "venueId", "connectorId", "createdAt");

-- CreateIndex
CREATE INDEX "SecretsVaultAudit_secretRef_createdAt_idx" ON "SecretsVaultAudit"("secretRef", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentConnectorInstall_organisationId_venueId_status_updat_idx" ON "PaymentConnectorInstall"("organisationId", "venueId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConnectorInstall_organisationId_venueId_key" ON "PaymentConnectorInstall"("organisationId", "venueId");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueAsset" ADD CONSTRAINT "VenueAsset_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalContext" ADD CONSTRAINT "PhysicalContext_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosPlaceMapping" ADD CONSTRAINT "PosPlaceMapping_physicalContextId_fkey" FOREIGN KEY ("physicalContextId") REFERENCES "PhysicalContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryToken" ADD CONSTRAINT "EntryToken_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityConsent" ADD CONSTRAINT "IdentityConsent_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityConsent" ADD CONSTRAINT "IdentityConsent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceSession" ADD CONSTRAINT "ExperienceSession_physicalContextId_fkey" FOREIGN KEY ("physicalContextId") REFERENCES "PhysicalContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExperienceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExperienceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLine" ADD CONSTRAINT "TransactionLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfilment" ADD CONSTRAINT "Fulfilment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExperienceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fulfilment" ADD CONSTRAINT "Fulfilment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfilmentLine" ADD CONSTRAINT "FulfilmentLine_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "Fulfilment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExperienceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExperienceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

