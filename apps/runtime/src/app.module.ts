import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { LeosModule } from './leos/leos.module';
import { EntryController } from './http/entry.controller';
import { SessionController } from './http/session.controller';
import { TransactionController } from './http/transaction.controller';
import { FulfilmentController } from './http/fulfilment.controller';
import { PaymentController } from './http/payment.controller';
import { CatalogueController } from './http/catalogue.controller';
import { IdentityController } from './http/identity.controller';
import { AssistanceController } from './http/assistance.controller';
import { ProfileController } from './http/profile.controller';
import { HealthController } from './http/health.controller';
import { SetupPaymentsController } from './http/setup-payments.controller';
import { GrowController } from './http/grow.controller';
import { OperateController } from './http/operate.controller';
import { EventsModule } from './events/events.module';
import { WsModule } from './ws/ws.module';
import { StaffAuthModule } from './staff-auth/staff-auth.module';

@Module({
  imports: [PrismaModule, LeosModule, EventsModule, WsModule, StaffAuthModule],
  controllers: [
    EntryController,
    SessionController,
    TransactionController,
    FulfilmentController,
    PaymentController,
    CatalogueController,
    IdentityController,
    ProfileController,
    AssistanceController,
    HealthController,
    SetupPaymentsController,
    GrowController,
    OperateController,
  ],
})
export class AppModule {}
