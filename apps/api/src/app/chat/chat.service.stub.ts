import { type AuthUser } from "@supabase/supabase-js";
import { type IChatService } from "./chat.service.interface";
import {
  AppUserRole,
  type BanUserDto,
  type ChatMessage,
  type GetMessagesResponseDto,
  type ModerationQueueDto,
  type ModerationSummaryDto,
  type ReportChatMessageDto,
  type UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";

export const chatServiceStub = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<ChatMessage> {
    return Promise.resolve({
      text,
      userId: user.id,
      fullName: "Test User",
      createdAt: new Date(),
      gameInstanceId
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMessages(
    limit: number,
    offset: number,
    gameInstanceId?: string,
    user?: AuthUser
  ): Promise<GetMessagesResponseDto> {
    return Promise.resolve({ messages: [], total: 0, hasMore: false });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reportMessage(messageId: number, user: AuthUser, report: ReportChatMessageDto): Promise<void> {
    return Promise.resolve();
  },
  getModerationSummary(user: AuthUser): Promise<ModerationSummaryDto> {
    return Promise.resolve({ role: AppUserRole.Moderator, pendingReportCount: 0 });
  },
  getModerationReports(user: AuthUser): Promise<ModerationQueueDto> {
    return Promise.resolve({ groups: [], bannedUsers: [], pendingReportCount: 0 });
  },
  updateReportStatus(reportId: number, user: AuthUser, body: UpdateChatReportStatusDto): Promise<void> {
    return Promise.resolve();
  },
  banUser(userId: string, user: AuthUser, body: BanUserDto): Promise<void> {
    return Promise.resolve();
  },
  unbanUser(userId: string, user: AuthUser): Promise<void> {
    return Promise.resolve();
  }
} satisfies IChatService;
