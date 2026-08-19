import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxService } from './outbox.service';
import { OutboxPublisherService } from './outbox-publisher.service';
import { EventBusService } from './event-bus.service';

@Module({
  imports: [PrismaModule],
  providers: [OutboxService, OutboxPublisherService, EventBusService],
  exports: [OutboxService, EventBusService],
})
export class EventsModule {}
