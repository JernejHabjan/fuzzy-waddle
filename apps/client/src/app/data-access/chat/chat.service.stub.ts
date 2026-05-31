import { type IChatService } from "./chat.service.interface";
import {
  AppUserRole,
  type ChatMessage,
  type GetMessagesResponseDto,
  type ModerationQueueDto,
  type ModerationSummaryDto
} from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";

export const chatServiceStub = {
  sendMessage(msg: ChatMessage): Promise<void> {
    return Promise.resolve();
  },
  getMessageListener(): Promise<Observable<ChatMessage> | undefined> {
    return Promise.resolve(undefined);
  },
  getMessages(): Promise<GetMessagesResponseDto> {
    return Promise.resolve({ messages: [], total: 0, hasMore: false });
  },
  reportMessage(): Promise<void> {
    return Promise.resolve();
  },
  getModerationSummary(): Promise<ModerationSummaryDto> {
    return Promise.resolve({ role: AppUserRole.Moderator, pendingReportCount: 0 });
  },
  getModerationReports(): Promise<ModerationQueueDto> {
    return Promise.resolve({ groups: [], bannedUsers: [], pendingReportCount: 0 });
  },
  updateReportStatus(): Promise<void> {
    return Promise.resolve();
  },
  banUser(): Promise<void> {
    return Promise.resolve();
  },
  unbanUser(): Promise<void> {
    return Promise.resolve();
  }
} satisfies IChatService;
