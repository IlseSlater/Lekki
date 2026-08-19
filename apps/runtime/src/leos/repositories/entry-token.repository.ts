import { Injectable } from '@nestjs/common';
import type { EntryTokenRecord, EntryTokenRepository } from '@lekki/runtime-entry';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaEntryTokenRepository implements EntryTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(token: string): Promise<EntryTokenRecord | null> {
    const row = await this.prisma.entryToken.findUnique({ where: { token } });
    if (!row) return null;
    return {
      token: row.token,
      organisationId: row.organisationId,
      venueId: row.venueId,
      physicalContextId: row.physicalContextId,
      profileId: row.profileId,
      profileVersion: row.profileVersion,
      active: row.active,
    };
  }
}
