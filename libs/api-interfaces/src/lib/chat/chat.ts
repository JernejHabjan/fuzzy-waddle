export interface ChatMessage {
  text: string;
  userId: string;
  fullName: string;
  createdAt: Date;
}

export enum GatewayChatEvent {
  CHAT_MESSAGE = 'chat-message'
}
