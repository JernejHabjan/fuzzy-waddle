import { type ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";

export interface IChatService {
  sendMessage(msg: ChatMessage): Promise<void>;
  getMessageListener(): Promise<Observable<ChatMessage> | undefined>;
}
