import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

/** Studio Identity → Venue brand (Guest Continuity). */
@Controller('setup/brand')
@UseGuards(StaffAuthGuard)
export class SetupBrandController {
  constructor(private readonly leos: LeosService) {}

  @Put()
  @RequireStaffPermission('organisation.manage')
  save(
    @Req() req: { staff?: StaffTokenClaims },
    @Body()
    body: {
      venueId: string;
      menuBrandEnabled?: boolean;
      brandColour?: string;
      venueName?: string;
      guestDesignJson?: Record<string, unknown>;
    },
  ) {
    return this.leos.updateVenueBrand({
      venueId: body.venueId,
      menuBrandEnabled: body.menuBrandEnabled,
      brandColour: body.brandColour,
      venueName: body.venueName,
      guestDesignJson: body.guestDesignJson,
    });
  }
}
