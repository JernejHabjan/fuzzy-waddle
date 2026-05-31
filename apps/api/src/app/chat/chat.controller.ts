import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { OnlineAccessGuard } from "../../auth/guards/online-access.guard";
import { GetMessagesDto } from "./get-messages.dto";
import type {
  GetMessagesResponseDto,
  ModerationQueueDto,
  ModerationSummaryDto
} from "@fuzzy-waddle/api-interfaces";
import { CurrentUser } from "../../auth/current-user";
import type { AuthUser } from "@supabase/supabase-js";
import { BanUserBodyDto, ReportChatMessageBodyDto, UpdateChatReportStatusBodyDto } from "./report-chat-message.dto";

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

  @Get("moderation/summary")
  @UseGuards(OnlineAccessGuard)
  async getModerationSummary(@CurrentUser() user: AuthUser): Promise<ModerationSummaryDto> {
    return this.chatService.getModerationSummary(user);
  }

  @Get("moderation/reports")
  @UseGuards(OnlineAccessGuard)
  async getModerationReports(@CurrentUser() user: AuthUser): Promise<ModerationQueueDto> {
    return this.chatService.getModerationReports(user);
  }

  @Post("moderation/reports/:reportId/status")
  @UseGuards(OnlineAccessGuard)
  async updateReportStatus(
    @CurrentUser() user: AuthUser,
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() body: UpdateChatReportStatusBodyDto
  ): Promise<void> {
    return this.chatService.updateReportStatus(reportId, user, body);
  }

  @Post("moderation/users/:userId/ban")
  @UseGuards(OnlineAccessGuard)
  async banUser(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body() body: BanUserBodyDto
  ): Promise<void> {
    return this.chatService.banUser(userId, user, body);
  }

  @Post("moderation/users/:userId/unban")
  @UseGuards(OnlineAccessGuard)
  async unbanUser(@CurrentUser() user: AuthUser, @Param("userId") userId: string): Promise<void> {
    return this.chatService.unbanUser(userId, user);
  }
}
