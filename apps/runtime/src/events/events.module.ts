import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LeosModule } from '../leos/leos.module';
import { OutboxService } from './outbox.service';
import { OutboxPublisherService } from './outbox-publisher.service';
import { EventBusService } from './event-bus.service';

@Module({
  imports: [PrismaModule, forwardRef(() => LeosModule)],
  providers: [OutboxService, OutboxPublisherService, EventBusService],
  exports: [OutboxService, EventBusService],
})
export class EventsModule {}
