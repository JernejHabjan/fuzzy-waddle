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
  CHAT_MESSAGE = 'chat-message',
  LittleMuncherSpectateRoom = 'little-muncher-spectate-room'
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

export interface SpectatorRoom {
  action: 'added' | 'existing' | 'removed';
  id: string; // todo some id?
}
