import { forwardRef, Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { ChatGateway } from "./chat.gateway";
import { UserProfilesModule } from "../user-profiles/user-profiles.module";
import { AuthModule } from "../../auth/auth.module";
import { ChatModerationController } from "./chat-moderation.controller";
import { ProbableWaffleModule } from "../probable-waffle/probable-waffle.module";

@Module({
  imports: [UserProfilesModule, AuthModule, forwardRef(() => ProbableWaffleModule)],
  providers: [ChatService, TextSanitizationService, ChatGateway],
  controllers: [ChatController, ChatModerationController],
  exports: [ChatService]
})
export class ChatModule {}
