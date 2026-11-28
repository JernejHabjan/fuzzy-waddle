import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SocialController } from "./social.controller";
import { SocialRepository } from "./social.repository";
import { SocialService } from "./social.service";

@Module({
  imports: [AuthModule],
  controllers: [SocialController],
  providers: [SocialRepository, SocialService],
  exports: [SocialService]
})
export class SocialModule {}
