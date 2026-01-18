import { type IChatService } from "./chat.service.interface";
import { type ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";

export const chatServiceStub = {
  sendMessage(msg: ChatMessage): Promise<void> {
    return Promise.resolve();
  },
  getMessageListener(): Promise<Observable<ChatMessage> | undefined> {
    return Promise.resolve(undefined);
  },
  getMessages(limit?: number): Promise<ChatMessage[]> {
    return Promise.resolve([]);
  }
} satisfies IChatService;
