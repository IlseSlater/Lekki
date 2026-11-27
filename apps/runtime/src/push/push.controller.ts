import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { PushService, type PushSubscriptionInput } from './push.service';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  /** The public key a phone needs to subscribe. Null when alerts are not set up. */
  @Get('key')
  key() {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(StaffAuthGuard)
  async subscribe(
    @Req() req: { staff: StaffTokenClaims },
    @Body() body: { subscription?: PushSubscriptionInput },
  ) {
    if (!body?.subscription) throw new BadRequestException('subscription is required');
    try {
      return await this.push.subscribe(req.staff, body.subscription);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Post('unsubscribe')
  @UseGuards(StaffAuthGuard)
  unsubscribe(
    @Req() req: { staff: StaffTokenClaims },
    @Body() body: { endpoint?: string },
  ) {
    if (!body?.endpoint) throw new BadRequestException('endpoint is required');
    return this.push.unsubscribe(req.staff, body.endpoint);
  }
}
