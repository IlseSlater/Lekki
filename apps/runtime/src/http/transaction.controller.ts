import { Body, Controller, Post } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { MissingFieldError } from '../leos/domain-errors';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly leos: LeosService) {}

  @Post()
  create(
    @Body()
    body: {
      sessionId: string;
      participantId?: string;
      participantSecret?: string;
      lines: Array<{
        catalogueItemId: string;
        quantity: number;
        notes?: string;
        selectionsJson?: unknown;
      }>;
    },
  ) {
    const participantSecret = body?.participantSecret?.trim();
    if (!participantSecret) throw new MissingFieldError('participantSecret');
    return this.leos.createTransaction({ ...body, participantSecret });
  }
}