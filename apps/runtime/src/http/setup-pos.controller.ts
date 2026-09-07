import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { newId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { MissingFieldError } from '../leos/domain-errors';

/**
 * Studio POS maps — place (Pilot table → PhysicalContext) and SKU
 * (Pilot SKU → opaque catalogueItemId). Staff-only; venue must belong to token org.
 * No Studio UI yet — curl/Postman for smoke until the security freeze lifts.
 */
@Controller('studio/pos')
@UseGuards(StaffAuthGuard)
@RequireStaffPermission('organisation.manage')
export class SetupPosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('venue/:venueId/places')
  async listPlaces(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    return this.prisma.posPlaceMapping.findMany({
      where: { venueId },
      include: { physicalContext: { select: { id: true, code: true, type: true } } },
      orderBy: { externalPlaceId: 'asc' },
    });
  }

  @Put('venue/:venueId/places')
  async upsertPlace(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @Body()
    body: { physicalContextId?: string; externalPlaceId?: string },
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const physicalContextId = body.physicalContextId?.trim() ?? '';
    const externalPlaceId = body.externalPlaceId?.trim() ?? '';
    if (!physicalContextId) throw new MissingFieldError('physicalContextId');
    if (!externalPlaceId) throw new MissingFieldError('externalPlaceId');

    const ctx = await this.prisma.physicalContext.findFirst({
      where: { id: physicalContextId, venueId },
      select: { id: true },
    });
    if (!ctx) throw new NotFoundException('Physical context not found in this venue');

    return this.prisma.posPlaceMapping.upsert({
      where: { physicalContextId },
      create: {
        id: newId('ppm'),
        venueId,
        physicalContextId,
        externalPlaceId,
      },
      update: { externalPlaceId },
    });
  }

  @Delete('venue/:venueId/places/:mappingId')
  async deletePlace(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @Param('mappingId') mappingId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const existing = await this.prisma.posPlaceMapping.findFirst({
      where: { id: mappingId, venueId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Place mapping not found');
    await this.prisma.posPlaceMapping.delete({ where: { id: mappingId } });
    return { ok: true };
  }

  @Get('venue/:venueId/skus')
  async listSkus(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    return this.prisma.posSkuMapping.findMany({
      where: { venueId },
      orderBy: { externalSkuId: 'asc' },
    });
  }

  @Put('venue/:venueId/skus')
  async upsertSku(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @Body()
    body: { catalogueItemId?: string; externalSkuId?: string },
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const catalogueItemId = body.catalogueItemId?.trim() ?? '';
    const externalSkuId = body.externalSkuId?.trim() ?? '';
    if (!catalogueItemId) throw new MissingFieldError('catalogueItemId');
    if (!externalSkuId) throw new MissingFieldError('externalSkuId');

    const item = await this.prisma.restaurantCatalogItem.findFirst({
      where: { id: catalogueItemId, venueId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Catalogue item not found in this venue');

    return this.prisma.posSkuMapping.upsert({
      where: { catalogueItemId },
      create: {
        id: newId('psm'),
        venueId,
        catalogueItemId,
        externalSkuId,
      },
      update: { externalSkuId },
    });
  }

  @Delete('venue/:venueId/skus/:mappingId')
  async deleteSku(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @Param('mappingId') mappingId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const existing = await this.prisma.posSkuMapping.findFirst({
      where: { id: mappingId, venueId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('SKU mapping not found');
    await this.prisma.posSkuMapping.delete({ where: { id: mappingId } });
    return { ok: true };
  }

  private async requireVenueInOrg(
    organisationId: string | undefined,
    venueId: string,
  ): Promise<void> {
    if (!organisationId?.trim()) throw new MissingFieldError('organisationId');
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId.trim(), organisationId: organisationId.trim() },
      select: { id: true },
    });
    if (!venue) throw new ForbiddenException('Venue is not in your organisation');
  }
}
