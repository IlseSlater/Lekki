import { Body, Controller, Headers, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertPilotWebhookAuthorized,
  translatePilotLineWebhook,
} from '@lekki/connector-pilot-pos';
import { LeosService } from '../leos/leos.service';
import { SessionNotActiveError } from '../leos/domain-errors';
import { requirePilotPosWebhookSecret } from '../leos/runtime-secrets';

/**
 * MVP Pilot POS ingress — authenticated webhook → appendExternalLine.
 * Place/SKU mapping lands later; callers pass sessionId explicitly for now.
 *
 * Auth: Authorization Bearer / X-Pilot-Webhook-Token, or X-Pilot-Signature HMAC.
 * Closed sessions return 200 ignored so the POS does not retry forever.
 */
@Controller('integrations/pos/pilot')
export class PilotPosController {
  constructor(private readonly leos: LeosService) {}

  @Post('notify')
  @HttpCode(200)
  async notify(
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

    const params = translatePilotLineWebhook(body);
    try {
      const result = await this.leos.appendExternalLine(params);
      return {
        ok: true,
        duplicated: result.duplicated,
        transactionId: result.transactionId,
      };
    } catch (err) {
      // POS must stop retrying — the visit is gone, not a transient failure.
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
