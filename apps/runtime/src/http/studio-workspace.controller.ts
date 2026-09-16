import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { MissingFieldError } from '../leos/domain-errors';
import { WorkspaceService } from '../leos/workspace.service';
import { maxBytesForKind } from '../leos/assets/asset-store';

/**
 * Studio workspace — durable venue presentation for split-screen Live Experience.
 * Primary contract; PUT /setup/brand remains a thin alias.
 */
@Controller('studio/workspace')
@UseGuards(StaffAuthGuard)
@RequireStaffPermission('organisation.manage')
export class StudioWorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get(':venueId')
  get(@Req() req: { staff?: StaffTokenClaims }, @Param('venueId') venueId: string) {
    const org = req.staff?.org;
    if (!org?.trim()) throw new MissingFieldError('organisationId');
    return this.workspace.getWorkspace(org, venueId);
  }

  @Patch(':venueId')
  patch(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @Body()
    body: {
      venueName?: string;
      brandColour?: string;
      menuBrandEnabled?: boolean;
      logoUrl?: string;
      menuCoverUrl?: string;
      location?: string;
      guestDesign?: Record<string, unknown>;
    },
  ) {
    const org = req.staff?.org;
    if (!org?.trim()) throw new MissingFieldError('organisationId');
    return this.workspace.patchWorkspace(org, venueId, body ?? {});
  }
}

@Controller('studio/venue')
@UseGuards(StaffAuthGuard)
@RequireStaffPermission('organisation.manage')
export class StudioVenueAssetsController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Post(':venueId/assets')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxBytesForKind('cover') },
    }),
  )
  upload(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { kind?: string },
  ) {
    const org = req.staff?.org;
    if (!org?.trim()) throw new MissingFieldError('organisationId');
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required (multipart field name: file)');
    }
    return this.workspace.uploadAsset({
      organisationId: org,
      venueId,
      kindRaw: body?.kind ?? '',
      buffer: file.buffer,
      contentType: file.mimetype || 'application/octet-stream',
      originalName: file.originalname,
    });
  }
}
