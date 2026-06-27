import type { UserId } from "../game-instance/player/player";
import {
  ChatReportStatus,
  type AppUserRole,
  type ChatReportReason,
  type UserAccountStatus
} from "../database/database-enums";

export interface ChatMessage {
  id?: number;
  text: string;
  userId: UserId;
  fullName: string;
  senderRole?: AppUserRole | null;
  createdAt: Date;
  gameInstanceId?: string | null;
  reportedByCurrentUser?: boolean;
  currentUserReportStatus?: ChatReportStatus | null;
}

export enum GatewayChatEvent {
  CHAT_MESSAGE = "chat-message"
}

export interface GetMessagesResponseDto {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

export interface ReportChatMessageDto {
  reason: ChatReportReason;
  details?: string;
}

export interface ModerationSummaryDto {
  role: AppUserRole;
  pendingReportCount: number;
}

export interface ModerationReportDto {
  id: number;
  messageId: number;
  reason: ChatReportReason;
  details?: string | null;
  reportStatus: ChatReportStatus;
  createdAt: Date;
  reporterUserId: string;
  reporterDisplayName: string;
  reporterEmail: string | null;
  reportedUserId: string | null;
  reportedUserDisplayName: string;
  reportedUserEmail: string | null;
  reportedUserRole?: AppUserRole | null;
  messageText: string;
  messageCreatedAt: Date;
}

export interface ModerationReportGroupDto {
  reportedUserId: string | null;
  reportedUserDisplayName: string;
  reportedUserEmail: string | null;
  reportedUserRole?: AppUserRole | null;
  reportedUserAccountStatus?: UserAccountStatus | null;
  reportedUserBannedUntil?: string | null;
  reports: ModerationReportDto[];
}

export interface ModerationQueueDto {
  groups: ModerationReportGroupDto[];
  bannedUsers: ModerationBannedUserDto[];
  pendingReportCount: number;
}

export interface UpdateChatReportStatusDto {
  status: typeof ChatReportStatus.Reviewed | typeof ChatReportStatus.Actioned;
}

export interface BanUserDto {
  bannedUntil?: string | null;
  moderationNote?: string;
}

export interface ModerationBannedUserDto {
  userId: string;
  displayName: string;
  email: string | null;
  role?: AppUserRole | null;
  accountStatus: UserAccountStatus;
  bannedUntil: string | null;
  moderationNote: string | null;
  updatedAt: Date;
}
