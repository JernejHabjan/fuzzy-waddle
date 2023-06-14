export type LittleMuncherCommunicatorType = 'move' | 'score' | 'pause' | 'timeClimbing' | 'reset';

export interface CommunicatorScoreEvent {
  score: number;
}

export interface CommunicatorClimbingEvent {
  timeClimbing: number;
}

export interface CommunicatorPauseEvent {
  pause: boolean;
}

export interface CommunicatorResetEvent {
  reset: boolean;
}

export enum LittleMuncherGatewayEvent {
  LittleMuncherRoom = 'little-muncher-spectate-room',
  LittleMuncherAction = 'little-muncher-action'
}
