import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { LeosBootstrapService } from './leos-bootstrap.service';
import { ProfileStoreService } from './profile-store.service';
import { PrismaEntryTokenRepository } from './repositories/entry-token.repository';
import { PrismaPhysicalContextRepository } from './repositories/physical-context.repository';
import {
  PrismaPhysicalContextBinding,
  PrismaSessionRepository,
} from './repositories/session.repository';
import { LeosService } from './leos.service';
import { SetupPaymentsService } from './setup-payments.service';
import { SecretsVaultService } from './secrets-vault.service';

@Module({
  imports: [EventsModule],
  providers: [
    ProfileStoreService,
    PrismaEntryTokenRepository,
    PrismaPhysicalContextRepository,
    PrismaSessionRepository,
    PrismaPhysicalContextBinding,
    LeosBootstrapService,
    LeosService,
    SetupPaymentsService,
    SecretsVaultService,
  ],
  exports: [
    LeosService,
    ProfileStoreService,
    LeosBootstrapService,
    SetupPaymentsService,
    SecretsVaultService,
  ],
})
export class LeosModule {}
