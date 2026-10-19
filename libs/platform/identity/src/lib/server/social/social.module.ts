import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SocialController } from "./social.controller";
import { SocialRepository } from "./social.repository";
import { SocialService } from "./social.service";
import { PresenceService } from "./presence.service";
import { PresenceGateway } from "./presence.gateway";

@Module({
  imports: [AuthModule],
  controllers: [SocialController],
  providers: [SocialRepository, SocialService, PresenceService, PresenceGateway],
  exports: [SocialService, PresenceService]
})
export class SocialModule {}
