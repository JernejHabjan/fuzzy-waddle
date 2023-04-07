import { ChatMessage } from '@fuzzy-waddle/api-interfaces';
import { Observable } from 'rxjs';

export interface IChatService {
  sendMessage(msg: ChatMessage): void;

  getMessage(): Observable<ChatMessage>;

  createMessage(message: string): ChatMessage;
}
