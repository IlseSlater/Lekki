import { Body, Controller, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { LeosService } from '../leos/leos.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly leos: LeosService) {}

  @Post('request/:sessionId')
  request(
    @Param('sessionId') sessionId: string,
    @Body()
    body?: { tipAmount?: number; scope?: 'visit' | 'mine' | 'equal'; participantId?: string },
  ) {
    const scope =
      body?.scope === 'mine' ? 'mine' : body?.scope === 'equal' ? 'equal' : 'visit';
    return this.leos.requestPayment(sessionId, {
      tipAmount: typeof body?.tipAmount === 'number' ? body.tipAmount : 0,
      scope,
      participantId: typeof body?.participantId === 'string' ? body.participantId : undefined,
    });
  }

  @Post(':paymentId/complete')
  complete(
    @Param('paymentId') paymentId: string,
    @Query('fail') fail?: string,
  ) {
    return this.leos.completePayment(paymentId, { fail: fail === 'true' });
  }

  /**
   * PayFast Instant Transaction Notification (ITN).
   * Must return HTTP 200 quickly; PayFast retries on non-200.
   * Local sandbox ITN requires a public notify URL (e.g. ngrok).
   */
  @Post('payfast/notify')
  @HttpCode(200)
  async payfastNotify(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const posted: Record<string, string> = {};
    const source = (body && Object.keys(body).length > 0 ? body : req.body) ?? {};
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null) continue;
      posted[key] = String(value);
    }
    return this.leos.handlePayFastItn(posted);
  }
}
