import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { newId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { MissingFieldError } from '../leos/domain-errors';
import { SecretsVaultService } from '../leos/secrets-vault.service';

const PILOT_CONNECTOR = 'pilot';

/**
 * Studio POS — Pilot install (stub verify) + place/SKU maps.
 * Staff-only; venue must belong to token org.
 */
@Controller('studio/pos')
@UseGuards(StaffAuthGuard)
@RequireStaffPermission('organisation.manage')
export class SetupPosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: SecretsVaultService,
  ) {}

  @Get('venue/:venueId/install')
  async getInstall(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const row = await this.prisma.posConnectorInstall.findUnique({
      where: {
        venueId_connectorId: { venueId, connectorId: PILOT_CONNECTOR },
      },
    });
    if (!row) {
      return {
        status: 'none',
        connectorId: PILOT_CONNECTOR,
        settlementOwner: 'lekki',
        posOwnership: 'ledger',
        apiKeySet: false,
        webhookSecretSet: false,
        webhookNotifyPath: `/integrations/pos/pilot/notify/${venueId}`,
      };
    }
    return {
      status: row.status,
      connectorId: row.connectorId,
      settlementOwner: row.settlementOwner,
      posOwnership: row.posOwnership,
      apiKeySet: !!row.apiKeySecretRef,
      webhookSecretSet: !!row.webhookSecretRef,
      webhookNotifyPath: `/integrations/pos/pilot/notify/${venueId}`,
    };
  }

  /**
   * Activate Pilot sync — vaults API key, issues webhook secret once.
   * External Pilot verify is stubbed until partner API access lands.
   */
  @Post('venue/:venueId/activate')
  async activate(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
    @Body()
    body: {
      apiKey?: string;
      settlementOwner?: 'lekki' | 'pos';
      posOwnership?: string;
    },
  ) {
    const org = req.staff?.org;
    await this.requireVenueInOrg(org, venueId);
    const apiKey = body.apiKey?.trim() ?? '';
    const settlementOwner =
      body.settlementOwner === 'pos' ? 'pos' : 'lekki';
    const posOwnership = (body.posOwnership?.trim() || 'ledger').slice(0, 32);

    const existing = await this.prisma.posConnectorInstall.findUnique({
      where: {
        venueId_connectorId: { venueId, connectorId: PILOT_CONNECTOR },
      },
    });

    let resolvedKey = apiKey;
    if (!resolvedKey && existing?.apiKeySecretRef) {
      resolvedKey = await this.vault.resolveSecret({
        organisationId: org!,
        venueId,
        connectorId: PILOT_CONNECTOR,
        secretRef: existing.apiKeySecretRef,
      });
    }
    if (!resolvedKey || resolvedKey.length < 8) {
      throw new MissingFieldError('apiKey');
    }

    // Stub verify — partner API pending. Fail closed on empty; never fake external OK.
    const webhookPlain = randomBytes(24).toString('base64url');

    const apiKeySecretRef = (
      await this.vault.storeSecret({
        organisationId: org!,
        venueId,
        connectorId: PILOT_CONNECTOR,
        secretKey: 'apiKey',
        plaintext: resolvedKey,
      })
    ).secretRef;
    const webhookSecretRef = (
      await this.vault.storeSecret({
        organisationId: org!,
        venueId,
        connectorId: PILOT_CONNECTOR,
        secretKey: 'webhookSecret',
        plaintext: webhookPlain,
      })
    ).secretRef;

    const data = {
      organisationId: org!,
      venueId,
      connectorId: PILOT_CONNECTOR,
      status: 'active',
      settlementOwner,
      posOwnership,
      apiKeySecretRef,
      webhookSecretRef,
    };

    if (existing) {
      await this.prisma.posConnectorInstall.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.posConnectorInstall.create({
        data: { id: newId('pci'), ...data },
      });
    }

    return {
      status: 'active',
      settlementOwner,
      posOwnership,
      webhookSecret: webhookPlain,
      webhookNotifyPath: `/integrations/pos/pilot/notify/${venueId}`,
      message:
        'Credentials saved. Paste the webhook secret into Pilot. Live Pilot API verification pending partner access.',
    };
  }

  /** All venue places + existing external ids for Studio mapping table. */
  @Get('venue/:venueId/place-workspace')
  async placeWorkspace(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const [contexts, maps] = await Promise.all([
      this.prisma.physicalContext.findMany({
        where: { venueId },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, type: true },
      }),
      this.prisma.posPlaceMapping.findMany({
        where: { venueId },
        select: {
          id: true,
          physicalContextId: true,
          externalPlaceId: true,
        },
      }),
    ]);
    const byCtx = new Map(maps.map((m) => [m.physicalContextId, m]));
    return {
      rows: contexts.map((c) => {
        const m = byCtx.get(c.id);
        return {
          physicalContextId: c.id,
          label: c.code,
          type: c.type,
          mappingId: m?.id ?? null,
          externalPlaceId: m?.externalPlaceId ?? '',
        };
      }),
    };
  }

  /** All catalogue items + existing SKU maps. */
  @Get('venue/:venueId/sku-workspace')
  async skuWorkspace(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('venueId') venueId: string,
  ) {
    await this.requireVenueInOrg(req.staff?.org, venueId);
    const [items, maps] = await Promise.all([
      this.prisma.restaurantCatalogItem.findMany({
        where: { venueId },
        orderBy: [{ category: 'asc' }, { label: 'asc' }],
        select: { id: true, label: true, category: true, unitPrice: true },
      }),
      this.prisma.posSkuMapping.findMany({
        where: { venueId },
        select: { id: true, catalogueItemId: true, externalSkuId: true },
      }),
    ]);
    const byItem = new Map(maps.map((m) => [m.catalogueItemId, m]));
    return {
      rows: items.map((i) => {
        const m = byItem.get(i.id);
        return {
          catalogueItemId: i.id,
          label: i.label,
          category: i.category,
          unitPrice: Number(i.unitPrice),
          mappingId: m?.id ?? null,
          externalSkuId: m?.externalSkuId ?? '',
        };
      }),
    };
  }

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
