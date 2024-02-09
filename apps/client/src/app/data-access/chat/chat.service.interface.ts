import { ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";

export interface IChatService {
  sendMessage(msg: ChatMessage): void;
  get listenToMessages(): Observable<ChatMessage> | undefined;
}
