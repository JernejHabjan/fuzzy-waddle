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
  LittleMuncherRoom = 'little-muncher-spectate-room',
  LittleMuncherSpectator = 'little-muncher-spectator',
  LittleMuncherMove = 'little-muncher-move'
}

export interface LittleMuncherGameInstance {
  gameInstanceId: string;
}

export interface LittleMuncherGameInstanceCreateDto {
  gameInstanceId: string;
}

export interface LittleMuncherLevel {
  hillName: LittleMuncherHills;
}

export interface LittleMuncherGameCreate {
  level: LittleMuncherLevel;
  player_ids: string[];
}

export interface LittleMuncherGameCreateDto extends LittleMuncherGameCreate {
  gameInstanceId: string;
}

export interface LittleMuncherGameDestroyDto {
  gameInstanceId: string;
}

export enum LittleMuncherHills {
  Stefka = 0,
  Jakob = 1
}

export interface Room {
  gameInstanceId: string;
}

export interface RoomEvent {
  room: Room;
  action: RoomAction;
}

export type RoomAction = 'added' | 'existing' | 'removed';

export interface SpectatorEvent {
  room: Room;
  user_id: string;
  action: SpectatorAction;
}

export type SpectatorAction = 'joined' | 'left';

export interface LittleMuncherSceneCommunicatorKeyEvent {
  key: string;
}
