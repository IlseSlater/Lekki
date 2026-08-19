import { Body, Controller, Post } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly leos: LeosService) {}

  @Post()
  create(
    @Body()
    body: {
      sessionId: string;
      participantId?: string;
      lines: Array<{
        catalogueItemId: string;
        label: string;
        quantity: number;
        unitPrice: number;
        routingTags: string[];
      }>;
    },
  ) {
    return this.leos.createTransaction(body);
  }
}
