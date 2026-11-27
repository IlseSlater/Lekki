import { Injectable, NotFoundException } from '@nestjs/common';
import { newId } from '@lekki/shared';
import { RESTAURANT_PHYSICAL_CONTEXT_TYPE } from '@lekki/pack-restaurant';
import { PrismaService } from '../prisma/prisma.service';
import { MissingFieldError } from './domain-errors';
import { missingPlaceCodes, normalisePlaceCodes } from './place-codes';

const PROFILE_FALLBACK = {
  profileId: 'profile-restaurant',
  profileVersion: '1.0.0',
};

export type EnsuredPlace = {
  code: string;
  physicalContextId: string;
  token: string;
};

/**
 * The owner says how many places there are. The backend creates each place and its QR.
 * Additive only: a place that exists, or has a guest at it, is never removed.
 */
@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePlaces(input: {
    organisationId: string;
    codes: unknown;
  }): Promise<{ venueId: string; places: EnsuredPlace[] }> {
    const organisationId = input.organisationId?.trim();
    if (!organisationId) throw new MissingFieldError('organisationId');
    const codes = normalisePlaceCodes(input.codes);
    if (!codes.length) throw new MissingFieldError('codes');

    const venue = await this.prisma.venue.findFirst({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
    });
    if (!venue) throw new NotFoundException('Venue not found for organisation');

    return this.prisma.$transaction(async (tx) => {
      // One writer per venue so two tabs cannot create the same place twice.
      // $executeRaw: the lock function returns void, which $queryRaw cannot read back.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${venue.id}))`;

      const existing = await tx.physicalContext.findMany({ where: { venueId: venue.id } });
      const baseToken = await tx.entryToken.findFirst({
        where: { venueId: venue.id, active: true },
        orderBy: { token: 'asc' },
      });
      const profileId = baseToken?.profileId ?? PROFILE_FALLBACK.profileId;
      const profileVersion = baseToken?.profileVersion ?? PROFILE_FALLBACK.profileVersion;
      const contextType = existing[0]?.type ?? RESTAURANT_PHYSICAL_CONTEXT_TYPE;

      for (const code of missingPlaceCodes(
        codes,
        existing.map((c) => c.code),
      )) {
        await tx.physicalContext.create({
          data: {
            id: newId('pc'),
            organisationId,
            venueId: venue.id,
            code,
            type: contextType,
          },
        });
      }

      const wanted = new Set(codes.map((c) => c.toLowerCase()));
      const contexts = (await tx.physicalContext.findMany({ where: { venueId: venue.id } })).filter(
        (c) => wanted.has(c.code.toLowerCase()),
      );

      const places: EnsuredPlace[] = [];
      for (const ctx of contexts) {
        let entry = await tx.entryToken.findFirst({
          where: { venueId: venue.id, physicalContextId: ctx.id, active: true },
          orderBy: { token: 'asc' },
        });
        if (!entry) {
          entry = await tx.entryToken.create({
            data: {
              token: `e_${newId('qr').replace(/^qr_/, '')}`,
              organisationId,
              venueId: venue.id,
              physicalContextId: ctx.id,
              profileId,
              profileVersion,
              active: true,
            },
          });
        }
        places.push({ code: ctx.code, physicalContextId: ctx.id, token: entry.token });
      }

      const order = new Map(codes.map((c, i) => [c.toLowerCase(), i]));
      places.sort((a, b) => (order.get(a.code.toLowerCase()) ?? 0) - (order.get(b.code.toLowerCase()) ?? 0));
      return { venueId: venue.id, places };
    });
  }
}
