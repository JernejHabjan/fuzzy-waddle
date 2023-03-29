import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SupabaseProviderService } from '../../core/supabase-provider/supabase-provider.service';
import { TextSanitizationService } from '../../core/content-filters/text-sanitization.service';

@Module({
  providers: [ChatService, SupabaseProviderService, TextSanitizationService],
  controllers: [ChatController],
  exports: [ChatService]
})
export class ChatModule {}
