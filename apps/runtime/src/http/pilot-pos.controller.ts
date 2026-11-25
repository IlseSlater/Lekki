import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  assertPilotWebhookAuthorized,
  translatePilotLineWebhook,
} from '@lekki/connector-pilot-pos';
import { LeosService } from '../leos/leos.service';
import { SessionNotActiveError } from '../leos/domain-errors';
import { requirePilotPosWebhookSecret } from '../leos/runtime-secrets';
import { SecretsVaultService } from '../leos/secrets-vault.service';
import { choosePilotWebhookSecretSource } from '../leos/pilot-webhook-secret';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Pilot POS ingress — authenticated webhook → place/SKU resolve → appendExternalLine.
 *
 * Auth: Authorization Bearer / X-Pilot-Webhook-Token, or X-Pilot-Signature HMAC.
 * A venue with its own vaulted secret accepts only that secret. The shared env
 * secret is accepted only for venues with none, and never in production.
 * Path venueId scopes PosPlaceMapping / PosSkuMapping (no cross-tenant SKU collisions).
 * No open visit / closed session → 200 ignored so the till does not retry forever.
 */
@Controller('integrations/pos/pilot')
export class PilotPosController {
  private readonly logger = new Logger(PilotPosController.name);

  constructor(
    private readonly leos: LeosService,
    private readonly prisma: PrismaService,
    private readonly vault: SecretsVaultService,
  ) {}

  @Post('notify/:venueId')
  @HttpCode(200)
  async notify(
    @Param('venueId') venueId: string,
    @Req() req: Request,
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
    @Headers('x-pilot-webhook-token') webhookToken?: string,
    @Headers('x-pilot-signature') signature?: string,
  ) {
    try {
      const secret = await this.resolveWebhookSecret(venueId);
      // HMAC must run over the bytes Pilot signed (kept by the json verify hook in
      // main.ts). Re-encoded JSON never matches, so no raw body = no HMAC path.
      const kept = (req as Request & { rawBody?: Buffer | string }).rawBody;
      const rawBody =
        typeof kept === 'string'
          ? kept
          : Buffer.isBuffer(kept)
            ? kept.toString('utf8')
            : undefined;
      assertPilotWebhookAuthorized({
        secret,
        bearerOrTokenHeader: authorization || webhookToken,
        signatureHeader: signature,
        rawBody,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'PilotWebhookUnauthorizedError') {
        throw new UnauthorizedException('Invalid Pilot webhook credentials');
      }
      throw err;
    }

    const payload = translatePilotLineWebhook(body);
    try {
      return await this.leos.appendFromPilotIngress(venueId, payload);
    } catch (err) {
      // Race: visit closed between place resolve and append.
      if (err instanceof SessionNotActiveError) {
        return {
          ok: true,
          ignored: true,
          reason: 'session_not_active',
        };
      }
      throw err;
    }
  }

  private async resolveWebhookSecret(venueId: string): Promise<string> {
    const install = await this.prisma.posConnectorInstall.findUnique({
      where: {
        venueId_connectorId: { venueId: venueId.trim(), connectorId: 'pilot' },
      },
      select: {
        organisationId: true,
        venueId: true,
        webhookSecretRef: true,
        status: true,
      },
    });
    const source = choosePilotWebhookSecretSource({
      install,
      nodeEnv: process.env.NODE_ENV,
    });
    if (source.kind === 'reject') throw pilotUnauthorized(source.reason);
    if (source.kind === 'env') return requirePilotPosWebhookSecret();
    try {
      return await this.vault.resolveSecret({
        organisationId: install!.organisationId,
        venueId: install!.venueId,
        connectorId: 'pilot',
        secretRef: source.secretRef,
      });
    } catch (err) {
      // Fail closed: never fall back to the shared env secret for a set-up venue.
      this.logger.error(
        `Pilot webhook secret unreadable for venue ${venueId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw pilotUnauthorized('venue_webhook_secret_unreadable');
    }
  }
}

function pilotUnauthorized(reason: string): Error {
  const err = new Error(`Pilot webhook rejected: ${reason}`);
  err.name = 'PilotWebhookUnauthorizedError';
  return err;
}
