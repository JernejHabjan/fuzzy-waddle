import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { MessageDto } from "./message.dto";
import { type ChatMessage } from "@fuzzy-waddle/api-interfaces";

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post("message")
  @UseGuards(SupabaseAuthGuard)
  async postMessage(@CurrentUser() user: AuthUser, @Body() body: MessageDto): Promise<void> {
    await this.chatService.postMessage(body.message, user);
  }

  @Get("messages")
  @UseGuards(SupabaseAuthGuard)
  async getMessages(@Query("limit") limit?: number): Promise<ChatMessage[]> {
    return await this.chatService.getMessages(limit);
  }
}
