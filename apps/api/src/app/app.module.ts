import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { GameSessionModule } from './game-session/game-session.module';
import { LittleMuncherModule } from './little-muncher/little-muncher.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    EventsModule,
    ChatModule,
    GameSessionModule,
    LittleMuncherModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
