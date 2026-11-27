import {
  Body,
  Controller,
  Headers,
  HttpCode,
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
import { PrismaService } from '../prisma/prisma.service';

/**
 * Pilot POS ingress — authenticated webhook → place/SKU resolve → appendExternalLine.
 *
 * Auth: Authorization Bearer / X-Pilot-Webhook-Token, or X-Pilot-Signature HMAC.
 * Prefer per-venue vaulted webhook secret (Studio activate); fall back to env.
 * Path venueId scopes PosPlaceMapping / PosSkuMapping (no cross-tenant SKU collisions).
 * No open visit / closed session → 200 ignored so the till does not retry forever.
 */
@Controller('integrations/pos/pilot')
export class PilotPosController {
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
      const raw = (req as Request & { rawBody?: Buffer | string }).rawBody;
      const rawBody =
        typeof raw === 'string'
          ? raw
          : Buffer.isBuffer(raw)
            ? raw.toString('utf8')
            : undefined;
      // Never re-encode JSON for HMAC — signature is over the exact request bytes.
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
    // Active install with its own secret — fail closed; never fall back to shared env.
    if (install?.webhookSecretRef && install.status === 'active') {
      try {
        return await this.vault.resolveSecret({
          organisationId: install.organisationId,
          venueId: install.venueId,
          connectorId: 'pilot',
          secretRef: install.webhookSecretRef,
        });
      } catch {
        throw new UnauthorizedException('Pilot webhook secret unavailable for venue');
      }
    }
    // No per-venue secret yet (dev / pre-activate) — shared env only.
    return requirePilotPosWebhookSecret();
  }
}
