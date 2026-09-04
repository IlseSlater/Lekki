import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SetupPaymentsService, type DraftPayload } from '../leos/setup-payments.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('setup/payments')
@UseGuards(StaffAuthGuard)
export class SetupPaymentsController {
  constructor(private readonly setup: SetupPaymentsService) {}

  @Get('providers')
  providers() {
    return this.setup.listProviders();
  }

  @Get('install')
  @RequireStaffPermission('organisation.manage')
  install(@Req() req: { staff?: StaffTokenClaims }) {
    return this.setup.getInstall(req.staff?.org);
  }

  @Post('test-connection')
  @RequireStaffPermission('organisation.manage')
  testConnection(
    @Req() req: { staff?: StaffTokenClaims },
    @Body()
    body: {
      organisationId?: string;
      venueId?: string;
      connectorId: string;
      environment?: 'sandbox' | 'production';
      merchantId?: string;
      merchantKey?: string;
      passphrase?: string;
    },
  ) {
    return this.setup.testConnection({
      ...body,
      organisationId: body.organisationId ?? req.staff?.org,
    });
  }

  @Put('draft')
  @RequireStaffPermission('organisation.manage')
  saveDraft(@Req() req: { staff?: StaffTokenClaims }, @Body() body: DraftPayload) {
    return this.setup.saveDraft({ ...body, organisationId: body.organisationId ?? req.staff?.org });
  }

  @Post('activate')
  @RequireStaffPermission('organisation.manage')
  activate(@Req() req: { staff?: StaffTokenClaims }) {
    return this.setup.activate(req.staff?.org);
  }
}
