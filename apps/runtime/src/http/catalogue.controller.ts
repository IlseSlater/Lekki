import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../events/outbox.service';
import { newEventId, newId } from '@lekki/shared';
import { id } from '@lekki/contracts';
import type { EventEnvelope } from '@lekki/contracts';
import { MissingFieldError } from '../leos/domain-errors';
import type { Prisma } from '@prisma/client';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';


type CatalogueBody = {
  label?: string;
  description?: string;
  unitPrice?: number;
  currency?: string;
  category?: string;
  routingTags?: string[];
  available?: boolean;
  imageUrl?: string;
  allergens?: string[];
  dietaryTags?: string[];
  ageRestricted?: boolean;
};

@Controller('catalogue')
export class CatalogueController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  @Get('venue/:venueId')
  list(@Param('venueId') venueId: string) {
    return this.prisma.restaurantCatalogItem.findMany({
      where: { venueId },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });
  }

  @Post('venue/:venueId')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  async create(@Param('venueId') venueId: string, @Body() body: CatalogueBody) {
    const label = (body.label || '').trim();
    const category = (body.category || '').trim();
    if (!label) throw new MissingFieldError('label');
    if (!category) throw new MissingFieldError('category');
    if (typeof body.unitPrice !== 'number') throw new MissingFieldError('unitPrice');

    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.restaurantCatalogItem.create({
        data: {
          id: newId('cat'),
          venueId,
          label,
          description: body.description?.trim() || null,
          unitPrice: body.unitPrice!,
          currency: body.currency ?? 'ZAR',
          category,
          routingTags: body.routingTags ?? ['food'],
          available: body.available !== false,
          imageUrl: body.imageUrl ?? null,
          allergens: cleanTags(body.allergens),
          dietaryTags: cleanTags(body.dietaryTags),
          ageRestricted: body.ageRestricted === true,
        },
      });
      await this.emitChanged(tx, venueId, created);
      return created;
    });
    return item;
  }

  @Put('item/:id')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  async update(@Param('id') itemId: string, @Body() body: CatalogueBody) {
    const item = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.restaurantCatalogItem.update({
        where: { id: itemId },
        data: {
          ...(body.label !== undefined ? { label: body.label.trim() } : {}),
          ...(body.description !== undefined
            ? { description: body.description?.trim() || null }
            : {}),
          ...(body.unitPrice !== undefined ? { unitPrice: body.unitPrice } : {}),
          ...(body.category !== undefined ? { category: body.category.trim() } : {}),
          ...(body.available !== undefined ? { available: body.available } : {}),
          ...(body.routingTags !== undefined ? { routingTags: body.routingTags } : {}),
          ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl || null } : {}),
          ...(body.allergens !== undefined ? { allergens: cleanTags(body.allergens) } : {}),
          ...(body.dietaryTags !== undefined
            ? { dietaryTags: cleanTags(body.dietaryTags) }
            : {}),
          ...(body.ageRestricted !== undefined
            ? { ageRestricted: body.ageRestricted === true }
            : {}),
        },
      });
      await this.emitChanged(tx, updated.venueId, updated);
      return updated;
    });
    return item;
  }

  private async emitChanged(
    tx: Prisma.TransactionClient,
    venueId: string,
    item: {
      id: string;
      label: string;
      description: string | null;
      unitPrice: { toString(): string } | number;
      category: string;
      available: boolean;
      routingTags: string[];
      imageUrl: string | null;
      allergens: string[];
      dietaryTags: string[];
      ageRestricted: boolean;
    },
  ) {
    const venue = await tx.venue.findUnique({
      where: { id: venueId },
      select: { organisationId: true, id: true },
    });
    if (!venue) return;

    const correlationId = newEventId();
    const envelope: EventEnvelope = {
      $schema: 'https://schemas.lekki.io/events/v1/envelope.json',
      eventId: newEventId(),
      eventName: 'CatalogueItemChanged',
      version: '1.0.0',
      occurredAt: new Date().toISOString(),
      producer: 'lekki:runtime',
      correlationId: id.correlation(correlationId),
      organisationId: id.organisation(venue.organisationId),
      venueId: id.venue(venue.id),
      payload: {
        venueId: venue.id,
        itemId: item.id,
        label: item.label,
        description: item.description,
        unitPrice: Number(item.unitPrice),
        category: item.category,
        available: item.available,
        routingTags: item.routingTags,
        imageUrl: item.imageUrl,
        allergens: item.allergens,
        dietaryTags: item.dietaryTags,
        ageRestricted: item.ageRestricted,
      },
      privacy: { containsPii: false, classification: 'PUBLIC' },
    };
    await this.outbox.append(envelope, tx);
  }
}

function cleanTags(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  return [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
}
