import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { AuthModule } from "../auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { ChatModule } from "./chat/chat.module";
import { GameSessionModule } from "./game-session/game-session.module";
import { LittleMuncherModule } from "./little-muncher/little-muncher.module";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { FlySquasherModule } from "./fly-squasher/fly-squasher.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 30
        // https://github.com/nestjs/throttler
        // The above would mean that 30 requests from the same IP can be made to a single endpoint in 1 minute
      }
    ]),
    AuthModule,
    ChatModule,
    GameSessionModule,
    LittleMuncherModule,
    FlySquasherModule
  ],
  controllers: [AppController],
  providers: [
    {
      // enable rate limiting for whole app
      // https://docs.nestjs.com/security/rate-limiting
      // https://github.com/nestjs/throttler
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
