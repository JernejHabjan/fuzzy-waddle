export type CommunicatorType = 'key' | 'score' | 'pause' | 'timeClimbing';

export interface CommunicatorEvent<T> {
  gameInstanceId: string;
  communicator: CommunicatorType;
  data: T;
}

export interface CommunicatorScoreEvent {
  score: number;
}

export interface CommunicatorClimbingEvent {
  timeClimbing: number;
}

export interface CommunicatorPauseEvent {
  pause: boolean;
}

export enum LittleMuncherGatewayEvent {
  LittleMuncherRoom = 'little-muncher-spectate-room',
  LittleMuncherAction = 'little-muncher-action'
}
