import { Body, Controller, HttpCode, Param, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { LeosService } from '../leos/leos.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import { MissingFieldError } from '../leos/domain-errors';

@Controller('payments')
export class PaymentController {
  constructor(private readonly leos: LeosService) {}

  @Post('request/:sessionId')
  request(
    @Param('sessionId') sessionId: string,
    @Body()
    body?: {
      tipAmount?: number;
      tipPercent?: number;
      scope?: 'visit' | 'mine' | 'equal';
      participantId?: string;
      participantSecret?: string;
    },
  ) {
    const scope =
      body?.scope === 'mine' ? 'mine' : body?.scope === 'equal' ? 'equal' : 'visit';
    const participantSecret = body?.participantSecret?.trim();
    if ((scope === 'mine' || scope === 'equal') && !participantSecret) {
      throw new MissingFieldError('participantSecret');
    }
    return this.leos.requestPayment(sessionId, {
      tipAmount: typeof body?.tipAmount === 'number' ? body.tipAmount : undefined,
      tipPercent: typeof body?.tipPercent === 'number' ? body.tipPercent : undefined,
      scope,
      participantId: typeof body?.participantId === 'string' ? body.participantId : undefined,
      participantSecret,
    });
  }

  /** Staff-only manual settlement — guests must never call this in production. */
  @Post(':paymentId/complete')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('payment.complete')
  complete(@Param('paymentId') paymentId: string) {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.LEOS_ALLOW_MANUAL_COMPLETE !== '1'
    ) {
      throw new ForbiddenException('Manual payment completion is disabled in production');
    }
    return this.leos.completePayment(paymentId);
  }

  /** Staff refund — routes through the active payment connector for the payment's org/venue. */
  @Post(':paymentId/refund')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('payment.complete')
  refund(
    @Param('paymentId') paymentId: string,
    @Body() body?: { amount?: number },
  ) {
    return this.leos.refundPayment(paymentId, body?.amount);
  }

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
