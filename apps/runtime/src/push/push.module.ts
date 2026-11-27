import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { StaffAuthModule } from '../staff-auth/staff-auth.module';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  imports: [EventsModule, StaffAuthModule],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
