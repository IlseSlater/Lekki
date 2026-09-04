import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { newId } from '@lekki/shared';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';

@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly prisma: PrismaService) {}

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
  create(
    @Param('venueId') venueId: string,
    @Body()
    body: {
      label: string;
      description?: string;
      unitPrice: number;
      currency?: string;
      category: string;
      routingTags?: string[];
      available?: boolean;
      imageUrl?: string;
    },
  ) {
    return this.prisma.restaurantCatalogItem.create({
      data: {
        id: newId('cat'),
        venueId,
        label: body.label.trim(),
        description: body.description?.trim() || null,
        unitPrice: body.unitPrice,
        currency: body.currency ?? 'ZAR',
        category: body.category.trim(),
        routingTags: body.routingTags ?? ['food'],
        available: body.available !== false,
        imageUrl: body.imageUrl ?? null,
      },
    });
  }

  @Put('item/:id')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      description?: string;
      unitPrice?: number;
      category?: string;
      available?: boolean;
      routingTags?: string[];
    },
  ) {
    return this.prisma.restaurantCatalogItem.update({
      where: { id },
      data: {
        ...(body.label !== undefined ? { label: body.label.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.unitPrice !== undefined ? { unitPrice: body.unitPrice } : {}),
        ...(body.category !== undefined ? { category: body.category.trim() } : {}),
        ...(body.available !== undefined ? { available: body.available } : {}),
        ...(body.routingTags !== undefined ? { routingTags: body.routingTags } : {}),
      },
    });
  }
}
