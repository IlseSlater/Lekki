import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SetupPaymentsService, type DraftPayload } from '../leos/setup-payments.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('setup/payments')
@UseGuards(StaffAuthGuard)
export class SetupPaymentsController {
  constructor(private readonly setup: SetupPaymentsService) {}

  private requireOrg(req: { staff?: StaffTokenClaims }): string {
    const org = req.staff?.org?.trim();
    if (!org) throw new UnauthorizedException('Staff organisation is required');
    return org;
  }

  @Get('providers')
  providers() {
    return this.setup.listProviders();
  }

  @Get('install')
  @RequireStaffPermission('organisation.manage')
  install(@Req() req: { staff?: StaffTokenClaims }) {
    return this.setup.getInstall(this.requireOrg(req));
  }

  @Post('test-connection')
  @RequireStaffPermission('organisation.manage')
  testConnection(
    @Req() req: { staff?: StaffTokenClaims },
    @Body()
    body: {
      venueId?: string;
      connectorId: string;
      environment?: 'sandbox' | 'production';
      merchantId?: string;
      merchantKey?: string;
      passphrase?: string;
    },
  ) {
    // organisationId from the staff token only — body org is ignored.
    return this.setup.testConnection({
      ...body,
      organisationId: this.requireOrg(req),
    });
  }

  @Put('draft')
  @RequireStaffPermission('organisation.manage')
  saveDraft(
    @Req() req: { staff?: StaffTokenClaims },
    @Body() body: Omit<DraftPayload, 'organisationId'> & { organisationId?: string },
  ) {
    const { organisationId: _ignored, ...rest } = body;
    return this.setup.saveDraft({
      ...rest,
      organisationId: this.requireOrg(req),
    });
  }

  @Post('activate')
  @RequireStaffPermission('organisation.manage')
  activate(@Req() req: { staff?: StaffTokenClaims }) {
    return this.setup.activate(this.requireOrg(req));
  }
}
