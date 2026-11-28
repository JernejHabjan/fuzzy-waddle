import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "@fuzzy-waddle/platform-identity/server/auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { ChatModule } from "@fuzzy-waddle/platform-chat/server/chat/chat.module";
import { LittleMuncherModule } from "@fuzzy-waddle/little-muncher-server";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { FlySquasherModule } from "@fuzzy-waddle/fly-squasher-server";
import { ProbableWaffleModule } from "@fuzzy-waddle/probable-waffle-server";
import { AchievementsModule } from "./achievements/achievements.module";
import { UserProfilesModule } from "@fuzzy-waddle/platform-identity/server/user-profiles/user-profiles.module";
import { SocialModule } from "@fuzzy-waddle/platform-identity/server/social/social.module";

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
    LittleMuncherModule,
    FlySquasherModule,
    ProbableWaffleModule,
    AchievementsModule,
    UserProfilesModule,
    SocialModule
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
