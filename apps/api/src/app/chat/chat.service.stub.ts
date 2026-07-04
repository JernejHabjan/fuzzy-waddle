import { type AuthUser } from "@supabase/supabase-js";
import { type IChatService } from "./chat.service.interface";
import { type ChatMessage, type GetMessagesResponseDto, type ReportChatMessageDto } from "@fuzzy-waddle/api-interfaces";

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
  }
} satisfies IChatService;
