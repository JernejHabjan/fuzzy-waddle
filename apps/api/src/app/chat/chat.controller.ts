import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { GetMessagesDto } from "./get-messages.dto";
import type { GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";
import { CurrentUser } from "../../auth/current-user";
import type { AuthUser } from "@supabase/supabase-js";
import { ReportChatMessageBodyDto } from "./report-chat-message.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("messages")
  @UseGuards(SupabaseAuthGuard)
  async getMessages(@Query() query: GetMessagesDto): Promise<GetMessagesResponseDto> {
    const { limit = 10, offset = 0, gameInstanceId } = query;
    return this.chatService.getMessages(limit, offset, gameInstanceId);
  }

  @Post("messages/:messageId/report")
  @UseGuards(SupabaseAuthGuard)
  async reportMessage(
    @CurrentUser() user: AuthUser,
    @Param("messageId", ParseIntPipe) messageId: number,
    @Body() body: ReportChatMessageBodyDto
  ): Promise<void> {
    return this.chatService.reportMessage(messageId, user, body);
  }
}
