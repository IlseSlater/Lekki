import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { MissingFieldError } from '../leos/domain-errors';
import { WorkspaceService } from '../leos/workspace.service';

/**
 * Thin alias for Identity → Venue brand.
 * Prefer PATCH /studio/workspace/:venueId for new Studio clients.
 */
@Controller('setup/brand')
@UseGuards(StaffAuthGuard)
export class SetupBrandController {
  constructor(private readonly workspace: WorkspaceService) {}

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
      logoUrl?: string;
      menuCoverUrl?: string;
      location?: string;
      guestDesignJson?: Record<string, unknown>;
    },
  ) {
    const org = req.staff?.org;
    if (!org?.trim()) throw new MissingFieldError('organisationId');
    const venueId = body.venueId?.trim();
    if (!venueId) throw new MissingFieldError('venueId');
    return this.workspace.patchWorkspace(org, venueId, {
      venueName: body.venueName,
      menuBrandEnabled: body.menuBrandEnabled,
      brandColour: body.brandColour,
      logoUrl: body.logoUrl,
      menuCoverUrl: body.menuCoverUrl,
      location: body.location,
      guestDesign: body.guestDesignJson,
    });
  }
}
