import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_PACE, normalisePace, type KitchenPace } from './kitchen-pace';

/** Reads and saves the venue's kitchen pace. The rules live in kitchen-pace.ts. */
@Injectable()
export class KitchenPaceService {
  constructor(private readonly prisma: PrismaService) {}

  async forVenue(venueId: string): Promise<{ pace: KitchenPace; timezone: string }> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { kitchenPaceJson: true, timezone: true },
    });
    return {
      pace: venue ? normalisePace(venue.kitchenPaceJson) : DEFAULT_PACE,
      timezone: venue?.timezone || 'Africa/Johannesburg',
    };
  }

  async forOrganisation(organisationId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return { venueId: venue.id, ...(await this.forVenue(venue.id)) };
  }

  async save(organisationId: string, input: unknown): Promise<KitchenPace> {
    const { venueId } = await this.forOrganisation(organisationId);
    const pace = normalisePace(input);
    await this.prisma.venue.update({
      where: { id: venueId },
      data: { kitchenPaceJson: pace as unknown as object },
    });
    return pace;
  }

  /** The one live switch: pause or resume new orders. */
  async setPaused(organisationId: string, paused: boolean): Promise<KitchenPace> {
    const { pace } = await this.forOrganisation(organisationId);
    return this.save(organisationId, { ...pace, paused });
  }
}
