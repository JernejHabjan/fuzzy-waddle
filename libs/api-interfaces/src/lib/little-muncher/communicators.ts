export type CommunicatorType = 'key' | 'score' | 'pause';

export interface CommunicatorEvent<T> {
  gameInstanceId: string;
  communicator: CommunicatorType;
  data: T;
}

export interface CommunicatorKeyEvent {
  key: string;
}

export interface CommunicatorScoreEvent {
  score: number;
}

export interface CommunicatorPauseEvent {
  pause: boolean;
}

export enum LittleMuncherGatewayEvent {
  LittleMuncherRoom = 'little-muncher-spectate-room',
  LittleMuncherAction = 'little-muncher-action'
}
