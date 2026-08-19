import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';

@Controller('entry')
export class EntryController {
  constructor(private readonly leos: LeosService) {}

  @Post('resolve')
  resolve(
    @Body()
    body: { token: string; displayName: string; identityId?: string; participantId?: string },
  ) {
    return this.leos.resolveEntryAndStartSession(body);
  }
}
