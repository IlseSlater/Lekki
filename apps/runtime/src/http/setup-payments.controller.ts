import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { SetupPaymentsService, type DraftPayload } from '../leos/setup-payments.service';

@Controller('setup/payments')
export class SetupPaymentsController {
  constructor(private readonly setup: SetupPaymentsService) {}

  @Get('providers')
  providers() {
    return this.setup.listProviders();
  }

  @Get('install')
  install() {
    return this.setup.getInstall();
  }

  @Post('test-connection')
  testConnection(
    @Body()
    body: {
      organisationId?: string;
      venueId?: string;
      connectorId: string;
      environment?: 'sandbox' | 'production';
      merchantId?: string;
      merchantKey?: string;
      passphrase?: string;
    },
  ) {
    return this.setup.testConnection(body);
  }

  @Put('draft')
  saveDraft(@Body() body: DraftPayload) {
    return this.setup.saveDraft(body);
  }

  @Post('activate')
  activate() {
    return this.setup.activate();
  }
}
