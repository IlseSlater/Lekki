import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  type CipherGCMTypes,
  type DecipherGCM,
} from 'node:crypto';
import { newId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';

type VaultAuditAction = 'write' | 'read' | 'verify';

@Injectable()
export class SecretsVaultService {
  private readonly algorithm: CipherGCMTypes = 'aes-256-gcm';
  private readonly keyVersion = 'v1';
  private readonly key = createHash('sha256')
    .update(process.env.LEKKI_VAULT_KEY || 'lekki-dev-vault-key')
    .digest();

  constructor(private readonly prisma: PrismaService) {}

  async storeSecret(input: {
    organisationId: string;
    venueId: string;
    connectorId: string;
    secretKey: string;
    plaintext: string;
  }) {
    const plaintext = input.plaintext.trim();
    if (!plaintext) throw new Error(`${input.secretKey} is required`);

    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const secretRef = `svr_${newId('sec')}`;

    await this.prisma.secretsVaultEntry.upsert({
      where: {
        organisationId_venueId_connectorId_secretKey: {
          organisationId: input.organisationId,
          venueId: input.venueId,
          connectorId: input.connectorId,
          secretKey: input.secretKey,
        },
      },
      update: {
        secretRef,
        algorithm: this.algorithm,
        keyVersion: this.keyVersion,
        cipherText: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      },
      create: {
        id: newId('sve'),
        organisationId: input.organisationId,
        venueId: input.venueId,
        connectorId: input.connectorId,
        secretKey: input.secretKey,
        secretRef,
        algorithm: this.algorithm,
        keyVersion: this.keyVersion,
        cipherText: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      },
    });

    await this.recordAudit({
      organisationId: input.organisationId,
      venueId: input.venueId,
      connectorId: input.connectorId,
      secretKey: input.secretKey,
      secretRef,
      action: 'write',
    });

    return { secretRef };
  }

  async resolveSecret(input: {
    organisationId: string;
    venueId: string;
    connectorId: string;
    secretRef: string;
    action?: Exclude<VaultAuditAction, 'write'>;
  }) {
    const row = await this.prisma.secretsVaultEntry.findFirst({
      where: {
        organisationId: input.organisationId,
        venueId: input.venueId,
        connectorId: input.connectorId,
        secretRef: input.secretRef,
      },
    });
    if (!row) throw new Error('Secret not found');

    const decipher = createDecipheriv(
      row.algorithm as CipherGCMTypes,
      this.key,
      Buffer.from(row.iv, 'base64'),
    ) as DecipherGCM;
    decipher.setAuthTag(Buffer.from(row.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(row.cipherText, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    await this.recordAudit({
      organisationId: row.organisationId,
      venueId: row.venueId,
      connectorId: row.connectorId,
      secretKey: row.secretKey,
      secretRef: row.secretRef,
      action: input.action ?? 'read',
    });

    return plaintext;
  }

  private async recordAudit(input: {
    organisationId: string;
    venueId: string;
    connectorId: string;
    secretKey: string;
    secretRef: string;
    action: VaultAuditAction;
  }) {
    await this.prisma.secretsVaultAudit.create({
      data: {
        id: newId('sva'),
        organisationId: input.organisationId,
        venueId: input.venueId,
        connectorId: input.connectorId,
        secretKey: input.secretKey,
        secretRef: input.secretRef,
        action: input.action,
        metadataJson: {},
      },
    });
  }
}
