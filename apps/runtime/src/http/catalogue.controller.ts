import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../events/outbox.service';
import { newEventId, newId } from '@lekki/shared';
import { id } from '@lekki/contracts';
import type { EventEnvelope } from '@lekki/contracts';
import { MissingFieldError } from '../leos/domain-errors';
import { planStarterMenu } from '../leos/starter-menu';
import { KitchenPaceService } from '../leos/kitchen-pace.service';
import { itemSoldOut } from '../leos/kitchen-pace';
import type { Prisma } from '@prisma/client';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';


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
    private readonly kitchenPace: KitchenPaceService,
  ) {}

  @Get('venue/:venueId')
  async list(@Param('venueId') venueId: string) {
    const [items, { pace }] = await Promise.all([
      this.prisma.restaurantCatalogItem.findMany({
        where: { venueId },
        orderBy: [{ category: 'asc' }, { label: 'asc' }],
      }),
      this.kitchenPace.forVenue(venueId),
    ]);
    return items.map((item) => ({
      ...item,
      // Decimal serialises as text ("45"); guests' menus need a number or they show R0.00.
      unitPrice: Number(item.unitPrice),
      // Sold out for today reads as sold out until the venue's next day.
      available: !itemSoldOut(pace, item),
      soldOutUntil: item.id in pace.soldOutToday ? 'tomorrow' : item.available ? null : 'changed',
    }));
  }

  @Post('venue/:venueId')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  async create(
    @Param('venueId') venueId: string,
    @Body() body: CatalogueBody,
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    await this.assertVenueOwnedByStaff(venueId, req.staff!.org);
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

  /**
   * Give an empty menu a short priced starter the owner can correct.
   * A venue that already has any dish is left alone.
   */
  @Post('venue/:venueId/starter')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  async seedStarter(
    @Param('venueId') venueId: string,
    @Body() body: { typeId?: string },
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    await this.assertVenueOwnedByStaff(venueId, req.staff!.org);
    const seeded = await this.prisma.$transaction(async (tx) => {
      // One writer at a time per venue so two tabs cannot both seed.
      // $executeRaw: the lock function returns void, which $queryRaw cannot read back.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${venueId}))`;
      const existing = await tx.restaurantCatalogItem.count({ where: { venueId } });
      const plan = planStarterMenu(existing, body?.typeId);
      for (const item of plan) {
        const created = await tx.restaurantCatalogItem.create({
          data: {
            id: newId('cat'),
            venueId,
            label: item.label,
            description: item.description ?? null,
            unitPrice: item.unitPrice,
            currency: item.currency,
            category: item.category,
            routingTags: item.routingTags,
            available: true,
            allergens: [],
            dietaryTags: [],
            ageRestricted: false,
          },
        });
        await this.emitChanged(tx, venueId, created);
      }
      return plan.length;
    });
    return { seeded };
  }

  @Put('item/:id')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  async update(
    @Param('id') itemId: string,
    @Body() body: CatalogueBody,
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    const existing = await this.prisma.restaurantCatalogItem.findUnique({
      where: { id: itemId },
      select: { id: true, venueId: true },
    });
    if (!existing) throw new NotFoundException('Catalogue item not found');
    await this.assertVenueOwnedByStaff(existing.venueId, req.staff!.org);

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

  private async assertVenueOwnedByStaff(venueId: string, organisationId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { organisationId: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.organisationId !== organisationId) {
      throw new ForbiddenException('Wrong organisation');
    }
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
