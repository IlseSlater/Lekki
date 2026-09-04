import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { LeosModule } from '../leos/leos.module';
import { LeosGateway } from './leos.gateway';

@Module({
  imports: [EventsModule, StaffAuthModule, LeosModule],
  providers: [LeosGateway],
})
export class WsModule {}
