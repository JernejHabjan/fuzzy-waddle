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

export interface ProbableWaffleReplayTickDigest {
  tick: number;
  /** Deterministic digest of all player batches committed for this tick. */
  digest: string;
  /** Per-player deterministic digest for quick binary-search over divergence. */
  playerDigests: Record<number, string>;
  batchCount: number;
  commandCount: number;
}

export interface ProbableWaffleReplayDesyncDiagnostic {
  tick: number;
  remotePlayerNumber?: number;
  remoteUserId?: string;
  localHash: string;
  remoteHash: string;
  mismatchReason: string;
  actorDiffs: string[];
  playerDiffs: string[];
  researchDiff?: string;
}

export interface ProbableWaffleReplayDebugData {
  tickDigests: ProbableWaffleReplayTickDigest[];
  desyncDiagnostics: ProbableWaffleReplayDesyncDiagnostic[];
}

export interface ProbableWaffleReplayData {
  version: string;
  compatibilityVersion: string;
  seed: number;
  mapId?: number;
  players: ProbableWaffleReplayPlayerData[];
  commands: ProbableWaffleReplayCommandBatch[];
  /** Optional deterministic-debug payload used for replay verification and desync forensics. */
  debugData?: ProbableWaffleReplayDebugData;
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
  currentHostUserId?: string | null;
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
