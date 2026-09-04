import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { MissingFieldError } from '../leos/domain-errors';

@Controller('setup/entry')
@UseGuards(StaffAuthGuard)
export class SetupEntryController {
  constructor(private readonly leos: LeosService) {}

  @Get('context')
  @RequireStaffPermission('organisation.manage')
  context(@Req() req: { staff?: StaffTokenClaims }, @Query('placeCode') placeCode?: string) {
    const org = req.staff?.org;
    if (!org) throw new MissingFieldError('organisationId');
    return this.leos.resolveMintContext(org, placeCode);
  }

  @Post('mint')
  @RequireStaffPermission('organisation.manage')
  mint(
    @Body()
    body: {
      organisationId: string;
      venueId: string;
      physicalContextId: string;
      profileId: string;
      profileVersion: string;
    },
  ) {
    return this.leos.mintEntryToken(body);
  }
}
