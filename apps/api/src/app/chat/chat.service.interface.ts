import { type AuthUser } from "@supabase/supabase-js";
import type { ChatMessage, GetMessagesResponseDto, ReportChatMessageDto } from "@fuzzy-waddle/api-interfaces";

export interface IChatService {
  postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<ChatMessage>;
  getMessages(limit: number, offset: number, gameInstanceId?: string): Promise<GetMessagesResponseDto>;
  reportMessage(messageId: number, user: AuthUser, report: ReportChatMessageDto): Promise<void>;
}
