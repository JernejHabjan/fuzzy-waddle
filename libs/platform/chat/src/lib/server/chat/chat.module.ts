import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { TextSanitizationService } from "../content-filters/text-sanitization.service";
import { ChatGateway } from "./chat.gateway";
import { UserProfilesModule } from "@fuzzy-waddle/platform-identity/server/user-profiles/user-profiles.module";
import { AuthModule } from "@fuzzy-waddle/platform-identity/server/auth/auth.module";
import { ModerationController } from "./moderation.controller";
import { ChatModerationService } from "./chat-moderation.service";
import { GameChatAccessRegistry } from "./game-chat-access-registry";

@Module({
  imports: [UserProfilesModule, AuthModule],
  providers: [ChatService, ChatModerationService, TextSanitizationService, ChatGateway, GameChatAccessRegistry],
  controllers: [ChatController, ModerationController],
  exports: [ChatService, GameChatAccessRegistry]
})
export class ChatModule {}
