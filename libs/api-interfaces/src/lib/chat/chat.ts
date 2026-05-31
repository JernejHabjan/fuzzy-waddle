import type { UserId } from "../game-instance/player/player";
import type { ChatReportReason } from "../database/database-enums";

export interface ChatMessage {
  id?: number;
  text: string;
  userId: UserId;
  fullName: string;
  createdAt: Date;
  gameInstanceId?: string | null;
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
