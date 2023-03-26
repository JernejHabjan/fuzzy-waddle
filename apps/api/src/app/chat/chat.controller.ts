import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { IsNotEmpty, IsString } from 'class-validator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @UseGuards(SupabaseAuthGuard)
  async postMessage(@CurrentUser() user: AuthUser, @Body() body: MessageDto): Promise<void> {
    return this.chatService.postMessage(body.message, user);
  }
}
