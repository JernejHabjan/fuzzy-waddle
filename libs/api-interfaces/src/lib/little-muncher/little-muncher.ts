export interface CommunicatorKeyEvent {
  key: string;
}

export interface CommunicatorScoreEvent {
  score: number;
}

export interface CommunicatorPauseEvent {
  pause: boolean;
}

export enum LittleMuncherHills {
  Stefka = 0,
  Jakob = 1
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

export interface LittleMuncherGameInstance {
  gameInstanceId: string;
}

export enum LittleMuncherGatewayEvent {
  LittleMuncherRoom = 'little-muncher-spectate-room',
  LittleMuncherMove = 'little-muncher-move',
  LittleMuncherPause = 'little-muncher-pause',
  LittleMuncherScore = 'little-muncher-score'
}
