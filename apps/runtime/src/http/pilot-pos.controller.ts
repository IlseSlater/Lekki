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

/**
 * Pilot POS ingress — authenticated webhook → place/SKU resolve → appendExternalLine.
 *
 * Auth: Authorization Bearer / X-Pilot-Webhook-Token, or X-Pilot-Signature HMAC.
 * Path venueId scopes PosPlaceMapping / PosSkuMapping (no cross-tenant SKU collisions).
 * No open visit / closed session → 200 ignored so the till does not retry forever.
 */
@Controller('integrations/pos/pilot')
export class PilotPosController {
  constructor(private readonly leos: LeosService) {}

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
      const secret = requirePilotPosWebhookSecret();
      const rawBody =
        typeof (req as Request & { rawBody?: Buffer | string }).rawBody === 'string'
          ? (req as Request & { rawBody?: string }).rawBody
          : Buffer.isBuffer((req as Request & { rawBody?: Buffer }).rawBody)
            ? (req as Request & { rawBody?: Buffer }).rawBody!.toString('utf8')
            : JSON.stringify(body ?? {});
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
}
