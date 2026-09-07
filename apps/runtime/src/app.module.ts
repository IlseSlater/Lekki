import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { LeosModule } from './leos/leos.module';
import { EntryController } from './http/entry.controller';
import { SessionController } from './http/session.controller';
import { TransactionController } from './http/transaction.controller';
import { FulfilmentController } from './http/fulfilment.controller';
import { PaymentController } from './http/payment.controller';
import { PilotPosController } from './http/pilot-pos.controller';
import { CatalogueController } from './http/catalogue.controller';
import { IdentityController } from './http/identity.controller';
import { OauthController } from './http/oauth.controller';
import { AssistanceController } from './http/assistance.controller';
import { ProfileController } from './http/profile.controller';
import { HealthController } from './http/health.controller';
import { SetupPaymentsController } from './http/setup-payments.controller';
import { SetupBrandController } from './http/setup-brand.controller';
import { SetupEntryController } from './http/setup-entry.controller';
import { SetupPosController } from './http/setup-pos.controller';
import { GrowController } from './http/grow.controller';
import { OperateController } from './http/operate.controller';
import { EventsModule } from './events/events.module';
import { WsModule } from './ws/ws.module';
import { StaffAuthModule } from './staff-auth/staff-auth.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    LeosModule,
    EventsModule,
    WsModule,
    StaffAuthModule,
  ],
  controllers: [
    EntryController,
    SessionController,
    TransactionController,
    FulfilmentController,
    PaymentController,
    PilotPosController,
    CatalogueController,
    IdentityController,
    OauthController,
    ProfileController,
    AssistanceController,
    HealthController,
    SetupPaymentsController,
    SetupBrandController,
    SetupEntryController,
    SetupPosController,
    GrowController,
    OperateController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
