import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { LeosGateway } from './leos.gateway';

@Module({
  imports: [EventsModule, StaffAuthModule],
  providers: [LeosGateway],
})
export class WsModule {}
