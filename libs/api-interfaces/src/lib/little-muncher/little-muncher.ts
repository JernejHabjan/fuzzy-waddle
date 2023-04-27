export interface LittleMuncherCommunicatorKeyEvent {
  key: string;
}

export interface LittleMuncherCommunicatorScoreEvent {
  score: number;
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
  LittleMuncherMove = 'little-muncher-move'
}
