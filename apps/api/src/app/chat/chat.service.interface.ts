import { type AuthUser } from "@supabase/supabase-js";
import type {
  BanUserDto,
  ChatMessage,
  GetMessagesResponseDto,
  ModerationQueueDto,
  ModerationSummaryDto,
  ReportChatMessageDto,
  UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";

export interface IChatService {
  postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<ChatMessage>;
  getMessages(
    limit: number,
    offset: number,
    gameInstanceId: string | undefined,
    user: AuthUser
  ): Promise<GetMessagesResponseDto>;
  reportMessage(messageId: number, user: AuthUser, report: ReportChatMessageDto): Promise<void>;
  getModerationSummary(user: AuthUser): Promise<ModerationSummaryDto>;
  getModerationReports(user: AuthUser): Promise<ModerationQueueDto>;
  updateReportStatus(reportId: number, user: AuthUser, body: UpdateChatReportStatusDto): Promise<void>;
  banUser(userId: string, user: AuthUser, body: BanUserDto): Promise<void>;
  unbanUser(userId: string, user: AuthUser): Promise<void>;
}
