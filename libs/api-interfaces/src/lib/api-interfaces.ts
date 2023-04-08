export interface Message {
  message: string;
}

export interface ChatMessage {
  text: string;
  userId: string;
  fullName: string;
  createdAt: Date;
}

export enum GatewayEvent {
  CHAT_MESSAGE = 'chat-message'
}

export interface LittleMuncherGameInstanceCreateDto {
  gameInstanceId: string;
}

export interface LittleMuncherGameModeCreateDto {
  gameInstanceId: string;
  hillName: LittleMuncherHills;
}

export enum LittleMuncherHills {
  Stefka = 0,
  Jakob = 1
}
