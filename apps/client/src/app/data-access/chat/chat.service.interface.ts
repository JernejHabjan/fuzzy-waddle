import { ChatMessage } from '@fuzzy-waddle/api-interfaces';
import { Observable } from 'rxjs';

export interface IChatService {
  sendMessage(msg: ChatMessage): void;

  getMessage(): Observable<ChatMessage> | undefined;

  createMessage(message: string): ChatMessage;
}
