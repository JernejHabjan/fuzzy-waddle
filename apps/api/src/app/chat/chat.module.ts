import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { ChatGateway } from "./chat.gateway";

@Module({
  providers: [ChatService, SupabaseProviderService, TextSanitizationService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService]
})
export class ChatModule {}
