import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PACE,
  livePace,
  normalisePace,
  pausedPace,
  venueDate,
  type KitchenPace,
  type LivePace,
} from './kitchen-pace';

export type SoldOutMode = 'today' | 'until_changed' | 'back';

@Injectable()
export class KitchenPaceService {
  constructor(private readonly prisma: PrismaService) {}

  /** The pace as it stands now: an ended pause or busy spell no longer counts. */
  async forVenue(venueId: string, now = new Date()): Promise<{ pace: LivePace; timezone: string }> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { kitchenPaceJson: true, timezone: true },
    });
    const timezone = venue?.timezone || 'Africa/Johannesburg';
    const stored = venue ? normalisePace(venue.kitchenPaceJson) : DEFAULT_PACE;
    return { pace: livePace(stored, now, timezone), timezone };
  }

  /**
   * The venue a manager is working on. Each venue keeps its own pause, hours and sold-out
   * items; a venue from another organisation is never found. Without one, the first venue.
   */
  async forOrganisation(organisationId: string, venueId?: string | null) {
    const wanted = venueId?.trim();
    const venue = await this.prisma.venue.findFirst({
      where: { organisationId, ...(wanted ? { id: wanted } : {}) },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return { venueId: venue.id, ...(await this.forVenue(venue.id)) };
  }

  private async stored(venueId: string): Promise<KitchenPace> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { kitchenPaceJson: true },
    });
    return venue ? normalisePace(venue.kitchenPaceJson) : DEFAULT_PACE;
  }

  /**
   * A manager saves the pace. Fields the caller leaves out keep their value,
   * so an older screen never wipes closed days or sold-out items it does not show.
   */
  async save(organisationId: string, input: unknown, venueIdIn?: string | null): Promise<LivePace> {
    const { venueId } = await this.forOrganisation(organisationId, venueIdIn);
    const current = await this.stored(venueId);
    const patch = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
    const pace = normalisePace({ ...current, ...patch });
    await this.write(venueId, pace);
    return (await this.forVenue(venueId)).pace;
  }

  /** Pause or resume new orders; a pause can end by itself and carries a reason. */
  async setPaused(
    organisationId: string,
    input: { paused: boolean; minutes?: number | null; reason?: string | null; venueId?: string | null },
    now = new Date(),
  ): Promise<LivePace> {
    const { venueId } = await this.forOrganisation(organisationId, input.venueId);
    const next = pausedPace(await this.stored(venueId), input, now);
    await this.write(venueId, next);
    return (await this.forVenue(venueId, now)).pace;
  }

  /**
   * Sold out for today (back tomorrow by itself), until someone changes it, or back now.
   * Returns the item's venue and whether guests can order it.
   */
  async setSoldOut(
    organisationId: string,
    itemId: string,
    mode: SoldOutMode,
    now = new Date(),
  ): Promise<{ venueId: string; available: boolean }> {
    const item = await this.prisma.restaurantCatalogItem.findUnique({
      where: { id: itemId },
      select: { id: true, venueId: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    const venue = await this.prisma.venue.findFirst({
      where: { id: item.venueId, organisationId },
      select: { id: true, timezone: true },
    });
    if (!venue) throw new NotFoundException('Item not found');

    const pace = await this.stored(venue.id);
    const soldOutToday = { ...pace.soldOutToday };
    delete soldOutToday[item.id];
    if (mode === 'today') {
      soldOutToday[item.id] = venueDate(now, venue.timezone || 'Africa/Johannesburg');
    }
    await this.write(venue.id, { ...pace, soldOutToday });
    await this.prisma.restaurantCatalogItem.update({
      where: { id: item.id },
      data: { available: mode !== 'until_changed' },
    });
    return { venueId: venue.id, available: mode === 'back' };
  }

  private async write(venueId: string, pace: KitchenPace) {
    await this.prisma.venue.update({
      where: { id: venueId },
      data: { kitchenPaceJson: pace as unknown as object },
    });
  }
}
