export type LittleMuncherCommunicatorType = "move" | "score" | "pause" | "timeClimbing" | "reset";

export interface LittleMuncherCommunicatorScoreEvent {
  score: number;
}

export interface LittleMuncherCommunicatorClimbingEvent {
  timeClimbing: number;
}

export interface LittleMuncherCommunicatorPauseEvent {
  pause: boolean;
}

export interface LittleMuncherCommunicatorResetEvent {
  reset: boolean;
}

export enum LittleMuncherGatewayEvent {
  LittleMuncherRoom = "little-muncher-spectate-room",
  LittleMuncherAction = "little-muncher-action"
}
