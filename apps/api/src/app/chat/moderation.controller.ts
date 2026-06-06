import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import type { ModerationQueueDto, ModerationSummaryDto } from "@fuzzy-waddle/api-interfaces";
import { CurrentUser } from "../../auth/current-user";
import { ModeratorAccessGuard } from "../../auth/guards/moderator-access.guard";
import { ChatService } from "./chat.service";
import { BanUserBodyDto, UpdateChatReportStatusBodyDto } from "./report-chat-message.dto";

@Controller("moderation")
@UseGuards(ModeratorAccessGuard)
export class ModerationController {
  constructor(private readonly chatService: ChatService) {}

  @Get("summary")
  async getModerationSummary(@CurrentUser() user: AuthUser): Promise<ModerationSummaryDto> {
    return this.chatService.getModerationSummary(user);
  }

  @Get("reports")
  async getModerationReports(@CurrentUser() user: AuthUser): Promise<ModerationQueueDto> {
    return this.chatService.getModerationReports(user);
  }

  @Post("reports/:reportId/status")
  async updateReportStatus(
    @CurrentUser() user: AuthUser,
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() body: UpdateChatReportStatusBodyDto
  ): Promise<void> {
    return this.chatService.updateReportStatus(reportId, user, body);
  }

  @Post("users/:userId/ban")
  async banUser(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body() body: BanUserBodyDto
  ): Promise<void> {
    return this.chatService.banUser(userId, user, body);
  }

  @Post("users/:userId/unban")
  async unbanUser(@CurrentUser() user: AuthUser, @Param("userId") userId: string): Promise<void> {
    return this.chatService.unbanUser(userId, user);
  }
}
