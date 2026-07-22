import { GameInstanceMetadata, type GameInstanceMetadataData } from "@fuzzy-waddle/platform-game-sessions";
import type { GameCommand } from "./game-command";
import type {
  CampaignChapterId,
  CampaignGameSaveContext,
  CampaignId,
  CampaignMissionId,
  CampaignMissionProgressionSnapshot
} from "../../probable-waffle/campaign";
import type { CampaignMissionRuntimeEvent, CampaignMissionRuntimeState } from "../../probable-waffle/campaign-runtime";
import type { DeterministicRandomState } from "../../probable-waffle/deterministic-random";

export enum ProbableWaffleGameInstanceType {
  Matchmaking,
  SelfHosted,
  Skirmish,
  InstantGame,
  Replay,
  Campaign
}

export interface CampaignGameContext {
  campaignId: CampaignId;
  catalogVersion: number;
  chapterId: CampaignChapterId;
  missionId: CampaignMissionId;
  missionRevision: number;
  runId: string;
  difficulty?: "story" | "normal" | "hard";
  selectedLoadoutIds?: readonly string[];
  loadoutSnapshotHash?: string;
  developerOverride?: boolean;
  seenCinematicIds?: readonly string[];
  progressionSnapshot?: CampaignMissionProgressionSnapshot;
  restoredSaveContext?: CampaignGameSaveContext;
}

export interface ProbableWaffleReplayPlayerData {
  playerNumber: number;
  playerName?: string;
  userId?: string | null;
}

export interface ProbableWaffleReplayCommandBatch {
  tick: number;
  playerNumber: number;
  commands: GameCommand[];
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
  campaignMissionDiff?: string;
  campaignMissionFamilyDiff?: string;
  randomDiff?: string;
}

export interface CampaignReplayContext {
  readonly campaignId: CampaignId;
  readonly missionId: CampaignMissionId;
  readonly missionRevision: number;
  readonly difficulty: "story" | "normal" | "hard";
  readonly progressionSnapshot: CampaignMissionProgressionSnapshot;
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
  /** Non-world campaign inputs that cannot be regenerated from the command stream. */
  campaignEvents?: CampaignMissionRuntimeEvent[];
  /** Initial deterministic mission snapshot for campaign replay identity and restore checks. */
  campaignMissionInitialState?: CampaignMissionRuntimeState;
  randomInitialState?: DeterministicRandomState;
  campaignContext?: CampaignReplayContext;
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
  campaignContext?: CampaignGameContext;
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
