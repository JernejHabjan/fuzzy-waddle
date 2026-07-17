import { type ChatMessage, type GetMessagesResponseDto, type ReportChatMessageDto } from "@fuzzy-waddle/platform-chat";
import { Observable } from "rxjs";

export interface IChatService {
  sendMessage(msg: ChatMessage): Promise<void>;
  getMessageListener(): Promise<Observable<ChatMessage> | undefined>;
  getMessages(limit?: number, offset?: number, gameInstanceId?: string): Promise<GetMessagesResponseDto>;
  reportMessage(messageId: number, report: ReportChatMessageDto): Promise<void>;
}
