import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatModule } from '../chat/chat.module';

@Module({
  providers: [EventsGateway],
  imports: [ChatModule]
})
export class EventsModule {}
