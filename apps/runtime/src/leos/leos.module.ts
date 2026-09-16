import { Module, forwardRef } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
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
import { SessionAccessService } from './session-access.service';
import { PaymentExpiryService } from './payment-expiry.service';
import { WorkspaceService } from './workspace.service';
import { ASSET_STORE } from './assets/asset-store';
import { LocalDiskAssetStore } from './assets/local-disk-asset-store';

@Module({
  imports: [forwardRef(() => EventsModule), StaffAuthModule],
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
    SessionAccessService,
    PaymentExpiryService,
    WorkspaceService,
    {
      provide: ASSET_STORE,
      useFactory: () => new LocalDiskAssetStore(),
    },
  ],
  exports: [
    LeosService,
    ProfileStoreService,
    LeosBootstrapService,
    SetupPaymentsService,
    SecretsVaultService,
    SessionAccessService,
    PaymentExpiryService,
    WorkspaceService,
    ASSET_STORE,
  ],
})
export class LeosModule {}
