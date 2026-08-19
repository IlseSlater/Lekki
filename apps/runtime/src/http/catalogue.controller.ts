import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
