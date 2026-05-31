import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { ChatGateway } from "./chat.gateway";
import { UserProfilesModule } from "../user-profiles/user-profiles.module";
import { AuthModule } from "../../auth/auth.module";

@Module({
  imports: [UserProfilesModule, AuthModule],
  providers: [ChatService, TextSanitizationService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService]
})
export class ChatModule {}
