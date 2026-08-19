import { Injectable } from '@nestjs/common';
import type { PhysicalContextRecord, PhysicalContextRepository } from '@lekki/runtime-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaPhysicalContextRepository implements PhysicalContextRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PhysicalContextRecord | null> {
    const row = await this.prisma.physicalContext.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      organisationId: row.organisationId,
      venueId: row.venueId,
      code: row.code,
      type: row.type,
      activeSessionId: row.activeSessionId,
    };
  }
}
