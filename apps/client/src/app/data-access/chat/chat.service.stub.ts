import { type IChatService } from "./chat.service.interface";
import { type ChatMessage, type GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";
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
  }
} satisfies IChatService;
