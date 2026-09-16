import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { newId } from '@lekki/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ASSET_STORE,
  assertSafeAssetUrl,
  parseAssetKind,
  type AssetKind,
  type AssetStore,
} from './assets/asset-store';
import { venueHasActivePaymentInstall } from './payments-active';

export type WorkspaceDto = {
  venueId: string;
  venueName: string;
  organisationId: string;
  brandColour: string;
  menuBrandEnabled: boolean;
  logoUrl: string;
  menuCoverUrl: string;
  location: string;
  guestDesign: Record<string, unknown> | null;
  timezone: string;
  currency: string;
  paymentsActive: boolean;
};

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ASSET_STORE) private readonly assets: AssetStore,
  ) {}

  async getWorkspace(organisationId: string, venueId: string): Promise<WorkspaceDto> {
    const venue = await this.requireVenueInOrg(organisationId, venueId);
    return this.toDto(venue);
  }

  async patchWorkspace(
    organisationId: string,
    venueId: string,
    body: {
      venueName?: string;
      brandColour?: string;
      menuBrandEnabled?: boolean;
      logoUrl?: string;
      menuCoverUrl?: string;
      location?: string;
      guestDesign?: Record<string, unknown>;
    },
  ): Promise<WorkspaceDto> {
    const venue = await this.requireVenueInOrg(organisationId, venueId);
    const data: Record<string, unknown> = {};

    if (body.venueName !== undefined) {
      const name = body.venueName.trim();
      if (name) data.name = name;
    }
    if (body.brandColour !== undefined) {
      const colour = body.brandColour.trim();
      if (!/^#[0-9A-Fa-f]{6}$/.test(colour)) {
        throw new BadRequestException('brandColour must be a #RRGGBB hex colour');
      }
      data.brandColour = colour;
    }
    if (typeof body.menuBrandEnabled === 'boolean') {
      data.menuBrandEnabled = body.menuBrandEnabled;
    }
    if (body.logoUrl !== undefined) {
      try {
        data.logoUrl = assertSafeAssetUrl(body.logoUrl, 'logoUrl');
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Invalid logoUrl',
        );
      }
    }
    if (body.menuCoverUrl !== undefined) {
      try {
        data.menuCoverUrl = assertSafeAssetUrl(body.menuCoverUrl, 'menuCoverUrl');
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Invalid menuCoverUrl',
        );
      }
    }
    if (body.location !== undefined) {
      data.location = body.location.trim().slice(0, 200);
    }
    if (body.guestDesign !== undefined) {
      if (
        body.guestDesign === null ||
        typeof body.guestDesign !== 'object' ||
        Array.isArray(body.guestDesign)
      ) {
        throw new BadRequestException('guestDesign must be an object');
      }
      // Shallow merge — never wipe unspecified keys with a partial PATCH.
      const existing =
        venue.guestDesignJson &&
        typeof venue.guestDesignJson === 'object' &&
        !Array.isArray(venue.guestDesignJson)
          ? { ...(venue.guestDesignJson as Record<string, unknown>) }
          : {};
      data.guestDesignJson = { ...existing, ...body.guestDesign };
    }

    if (Object.keys(data).length === 0) {
      return this.toDto(venue);
    }

    const updated = await this.prisma.venue.update({
      where: { id: venue.id },
      data: data as Prisma.VenueUpdateInput,
    });
    return this.toDto(updated);
  }

  async uploadAsset(input: {
    organisationId: string;
    venueId: string;
    kindRaw: string;
    buffer: Buffer;
    contentType: string;
    originalName?: string;
  }) {
    const venue = await this.requireVenueInOrg(input.organisationId, input.venueId);
    let kind: AssetKind;
    try {
      kind = parseAssetKind(input.kindRaw);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid kind',
      );
    }
    if (kind !== 'logo' && kind !== 'cover') {
      throw new BadRequestException('Only logo and cover uploads are supported');
    }

    let uploaded;
    try {
      uploaded = await this.assets.upload({
        organisationId: input.organisationId,
        venueId: venue.id,
        kind,
        buffer: input.buffer,
        contentType: input.contentType,
        originalName: input.originalName,
      });
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Upload failed',
      );
    }

    const asset = await this.prisma.venueAsset.create({
      data: {
        id: newId('vas'),
        organisationId: input.organisationId,
        venueId: venue.id,
        kind,
        url: uploaded.url,
        storageKey: uploaded.storageKey,
        contentType: uploaded.contentType,
        byteSize: uploaded.byteSize,
        originalName: input.originalName?.slice(0, 200) ?? null,
      },
    });

    const venuePatch =
      kind === 'logo' ? { logoUrl: uploaded.url } : { menuCoverUrl: uploaded.url };
    await this.prisma.venue.update({
      where: { id: venue.id },
      data: venuePatch,
    });

    return {
      assetId: asset.id,
      kind,
      url: uploaded.url,
      byteSize: uploaded.byteSize,
      contentType: uploaded.contentType,
    };
  }

  private async requireVenueInOrg(organisationId: string, venueId: string) {
    const org = organisationId?.trim();
    const id = venueId?.trim();
    if (!org) throw new ForbiddenException('Organisation required');
    if (!id) throw new NotFoundException('Venue not found');
    const venue = await this.prisma.venue.findFirst({
      where: { id, organisationId: org },
    });
    if (!venue) throw new ForbiddenException('Venue is not in your organisation');
    return venue;
  }

  private async toDto(venue: {
    id: string;
    organisationId: string;
    name: string;
    brandColour: string;
    menuBrandEnabled: boolean;
    logoUrl: string;
    menuCoverUrl: string;
    location: string;
    guestDesignJson: unknown;
    timezone: string;
    currency: string;
  }): Promise<WorkspaceDto> {
    const guestDesign =
      venue.guestDesignJson &&
      typeof venue.guestDesignJson === 'object' &&
      !Array.isArray(venue.guestDesignJson)
        ? (venue.guestDesignJson as Record<string, unknown>)
        : null;
    const paymentsActive = await venueHasActivePaymentInstall(this.prisma, venue.id);
    return {
      venueId: venue.id,
      venueName: venue.name,
      organisationId: venue.organisationId,
      brandColour: venue.brandColour || '#d7a14a',
      menuBrandEnabled: false,
      logoUrl: venue.logoUrl || '',
      menuCoverUrl: '',
      location: venue.location || '',
      guestDesign,
      timezone: venue.timezone || 'Africa/Johannesburg',
      currency: venue.currency || 'ZAR',
      paymentsActive,
    };
  }
}
