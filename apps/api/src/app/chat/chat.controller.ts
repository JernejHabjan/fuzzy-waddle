import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { IsNotEmpty, IsString } from 'class-validator';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  // todo later on when supabase auth guard is implemented, add auth guard
  async postMessage(@Body() body: MessageDto): Promise<void> {
    return this.chatService.postMessage(body.message);
  }
}
