import { forwardRef, Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { ChatGateway } from "./chat.gateway";
import { UserProfilesModule } from "../user-profiles/user-profiles.module";
import { AuthModule } from "../../auth/auth.module";
import { ModerationController } from "./moderation.controller";
import { ProbableWaffleModule } from "../probable-waffle/probable-waffle.module";
import { ChatModerationService } from "./chat-moderation.service";

@Module({
  imports: [UserProfilesModule, AuthModule, forwardRef(() => ProbableWaffleModule)],
  providers: [ChatService, ChatModerationService, TextSanitizationService, ChatGateway],
  controllers: [ChatController, ModerationController],
  exports: [ChatService]
})
export class ChatModule {}
