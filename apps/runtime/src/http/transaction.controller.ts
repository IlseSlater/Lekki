import { Body, Controller, Post } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly leos: LeosService) {}

  @Post()
  create(@Body() body: CreateTransactionDto) {
    return this.leos.createTransaction({
      sessionId: body.sessionId,
      participantId: body.participantId,
      participantSecret: body.participantSecret,
      lines: body.lines.map((line) => ({
        catalogueItemId: line.catalogueItemId,
        quantity: line.quantity,
        notes: line.notes,
        selectionsJson: line.selectionsJson,
      })),
    });
  }
}
