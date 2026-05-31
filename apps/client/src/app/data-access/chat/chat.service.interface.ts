import {
  type BanUserDto,
  type ChatMessage,
  type GetMessagesResponseDto,
  type ModerationQueueDto,
  type ModerationSummaryDto,
  type ReportChatMessageDto,
  type UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";

export interface IChatService {
  sendMessage(msg: ChatMessage): Promise<void>;
  getMessageListener(): Promise<Observable<ChatMessage> | undefined>;
  getMessages(limit?: number, offset?: number, gameInstanceId?: string): Promise<GetMessagesResponseDto>;
  reportMessage(messageId: number, report: ReportChatMessageDto): Promise<void>;
  getModerationSummary(): Promise<ModerationSummaryDto>;
  getModerationReports(): Promise<ModerationQueueDto>;
  updateReportStatus(reportId: number, body: UpdateChatReportStatusDto): Promise<void>;
  banUser(userId: string, body: BanUserDto): Promise<void>;
  unbanUser(userId: string): Promise<void>;
}
