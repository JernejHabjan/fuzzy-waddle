import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { OnlineAccessGuard } from "../../auth/guards/online-access.guard";
import { GetMessagesDto } from "./get-messages.dto";
import type { GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";
import { CurrentUser } from "../../auth/current-user";
import type { AuthUser } from "@supabase/supabase-js";
import { ReportChatMessageBodyDto } from "./report-chat-message.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("messages")
  @UseGuards(OnlineAccessGuard)
  async getMessages(@CurrentUser() user: AuthUser, @Query() query: GetMessagesDto): Promise<GetMessagesResponseDto> {
    const { limit = 10, offset = 0, gameInstanceId } = query;
    return this.chatService.getMessages(limit, offset, gameInstanceId, user);
  }

  @Post("messages/:messageId/report")
  @UseGuards(OnlineAccessGuard)
  async reportMessage(
    @CurrentUser() user: AuthUser,
    @Param("messageId", ParseIntPipe) messageId: number,
    @Body() body: ReportChatMessageBodyDto
  ): Promise<void> {
    return this.chatService.reportMessage(messageId, user, body);
  }
}
