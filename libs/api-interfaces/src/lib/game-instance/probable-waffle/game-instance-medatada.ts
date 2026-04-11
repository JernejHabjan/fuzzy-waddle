import { GameInstanceMetadata, type GameInstanceMetadataData } from "../game-instance-metadata";

export enum ProbableWaffleGameInstanceType {
  Matchmaking,
  SelfHosted,
  Skirmish,
  InstantGame,
  Replay
}

export interface ProbableWaffleReplayPlayerData {
  playerNumber: number;
  playerName?: string;
  userId?: string | null;
}

export interface ProbableWaffleReplayCommandBatch {
  tick: number;
  playerNumber: number;
  commands: unknown[];
}

export interface ProbableWaffleReplayData {
  version: string;
  compatibilityVersion: string;
  seed: number;
  mapId?: number;
  players: ProbableWaffleReplayPlayerData[];
  commands: ProbableWaffleReplayCommandBatch[];
}

export interface GameInstanceMetadataStartOptions {
  loadFromSave?: boolean;
  replayData?: ProbableWaffleReplayData;
}

export interface ProbableWaffleGameInstanceMetadataData extends GameInstanceMetadataData {
  type: ProbableWaffleGameInstanceType;
  visibility: ProbableWaffleGameInstanceVisibility;
  name: string;
  startOptions: GameInstanceMetadataStartOptions;
  rndSeed: number;
}

export class ProbableWaffleGameInstanceMetadata extends GameInstanceMetadata<ProbableWaffleGameInstanceMetadataData> {
  isReplay(): boolean {
    return this.data.type === ProbableWaffleGameInstanceType.Replay;
  }

  isStartupLoad(): boolean {
    return this.data.startOptions.loadFromSave ?? false;
  }
}

export enum ProbableWaffleGameInstanceVisibility {
  Public = "public",
  Private = "private"
}
