import { forwardRef, Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { TextSanitizationService } from "@fuzzy-waddle/platform-chat/server/content-filters/text-sanitization.service";
import { ChatGateway } from "./chat.gateway";
import { UserProfilesModule } from "@fuzzy-waddle/platform-identity/server/user-profiles/user-profiles.module";
import { AuthModule } from "@fuzzy-waddle/platform-identity/server/auth/auth.module";
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
