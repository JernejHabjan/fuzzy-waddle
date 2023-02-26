export interface Message {
  message: string;
}

export interface ChatMessage {
  text: string;
  userId: string;
  createdAt: Date;
}

export enum GatewayEvent {
  CHAT_MESSAGE = 'chat-message'
}
