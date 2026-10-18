import { GameInstanceMetadata, type GameInstanceMetadataData } from "@fuzzy-waddle/platform-game-sessions";
import type { GameCommand } from "./game-command";
import type {
  CampaignChapterId,
  CampaignGameSaveContext,
  CampaignId,
  CampaignMissionId,
  CampaignMissionProgressionSnapshot,
  CampaignParticipantProgressionSnapshot
} from "../../probable-waffle/campaign";
import type { CampaignMissionRuntimeEvent, CampaignMissionRuntimeState } from "../../probable-waffle/campaign-runtime";
import type { DeterministicRandomState } from "../../probable-waffle/deterministic-random";

/**
 * Defines the closed probable waffle game instance type classification. Use an explicit member rather than a
 * free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleGameInstanceType {
  /**
   * Selects the `Matchmaking` case of {@link ProbableWaffleGameInstanceType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Matchmaking,
  /**
   * Selects the `SelfHosted` case of {@link ProbableWaffleGameInstanceType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  SelfHosted,
  /**
   * Selects the `Skirmish` case of {@link ProbableWaffleGameInstanceType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Skirmish,
  /**
   * Selects the `InstantGame` case of {@link ProbableWaffleGameInstanceType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  InstantGame,
  /**
   * Selects the `Replay` case of {@link ProbableWaffleGameInstanceType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Replay,
  /**
   * Selects the `Campaign` case of {@link ProbableWaffleGameInstanceType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Campaign
}

/**
 * Defines the structured campaign game context contract for this module. Its declared surface makes campaign
 * id, catalog version, chapter id, mission id, mission revision explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignGameContext {
  /**
   * stable campaign id used by {@link CampaignGameContext} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  campaignId: CampaignId;
  /**
   * compatibility catalog version for {@link CampaignGameContext}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  catalogVersion: number;
  /**
   * stable chapter id used by {@link CampaignGameContext} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  chapterId: CampaignChapterId;
  /**
   * stable mission id used by {@link CampaignGameContext} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  missionId: CampaignMissionId;
  /**
   * compatibility mission revision for {@link CampaignGameContext}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  missionRevision: number;
  /**
   * stable run id used by {@link CampaignGameContext} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  runId: string;
  /**
   * Optional difficulty value carried by {@link CampaignGameContext}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  difficulty?: "story" | "normal" | "hard";
  /**
   * Optional collection owned by {@link CampaignGameContext}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  selectedLoadoutIds?: readonly string[];
  /**
   * Optional string loadout snapshot hash carried by {@link CampaignGameContext}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  loadoutSnapshotHash?: string;
  /**
   * Optional developer override value carried by {@link CampaignGameContext}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  developerOverride?: boolean;
  /**
   * Optional collection owned by {@link CampaignGameContext}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  seenCinematicIds?: readonly string[];
  /**
   * Optional progression snapshot value carried by {@link CampaignGameContext}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  progressionSnapshot?: CampaignMissionProgressionSnapshot;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignGameContext}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  humanParticipantCount?: number;
  /**
   * Optional collection value on {@link CampaignGameContext}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  participantProgressionSnapshots?: readonly CampaignParticipantProgressionSnapshot[];
  /**
   * Optional human-facing restored save context for {@link CampaignGameContext}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  restoredSaveContext?: CampaignGameSaveContext;
}

/**
 * Defines the structured probable waffle replay player data contract for this module. Its declared surface
 * makes player number, player name, user id explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleReplayPlayerData {
  /**
   * numeric player number carried by {@link ProbableWaffleReplayPlayerData}. Its units and valid range are
   * defined by {@link ProbableWaffleReplayPlayerData} and must remain consistent across producers and consumers.
   */
  playerNumber: number;
  /**
   * Optional human-facing player name for {@link ProbableWaffleReplayPlayerData}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  playerName?: string;
  /**
   * Optional stable user id used by {@link ProbableWaffleReplayPlayerData} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  userId?: string | null;
}

/**
 * Defines the structured probable waffle replay command batch contract for this module. Its declared surface
 * makes tick, player number, commands explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleReplayCommandBatch {
  /**
   * temporal value for {@link ProbableWaffleReplayCommandBatch}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * numeric player number carried by {@link ProbableWaffleReplayCommandBatch}. Its units and valid range are
   * defined by {@link ProbableWaffleReplayCommandBatch} and must remain consistent across producers and
   * consumers.
   */
  playerNumber: number;
  /**
   * collection owned by {@link ProbableWaffleReplayCommandBatch}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  commands: GameCommand[];
}

/**
 * Defines the structured probable waffle replay tick digest contract for this module. Its declared surface
 * makes tick, digest, player digests, batch count, command count explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleReplayTickDigest {
  /**
   * temporal value for {@link ProbableWaffleReplayTickDigest}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /** Documents the digest member and its declared contract at this boundary. */
  digest: string;
  /** Documents the player digests member and its declared contract at this boundary. */
  playerDigests: Record<number, string>;
  /**
   * numeric bound or quantity carried by {@link ProbableWaffleReplayTickDigest}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  batchCount: number;
  /**
   * numeric bound or quantity carried by {@link ProbableWaffleReplayTickDigest}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  commandCount: number;
}

/**
 * Defines the structured probable waffle replay desync diagnostic contract for this module. Its declared
 * surface makes tick, remote player number, remote user id, local hash, remote hash explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface ProbableWaffleReplayDesyncDiagnostic {
  /**
   * temporal value for {@link ProbableWaffleReplayDesyncDiagnostic}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * Optional numeric remote player number carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Its units and
   * valid range are defined by {@link ProbableWaffleReplayDesyncDiagnostic} and must remain consistent across
   * producers and consumers.
   */
  remotePlayerNumber?: number;
  /**
   * Optional stable remote user id used by {@link ProbableWaffleReplayDesyncDiagnostic} to correlate this value
   * with related records, events, or authored content; it is not a display label.
   */
  remoteUserId?: string;
  /**
   * string local hash carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  localHash: string;
  /**
   * string remote hash carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  remoteHash: string;
  /**
   * string mismatch reason carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  mismatchReason: string;
  /**
   * collection value on {@link ProbableWaffleReplayDesyncDiagnostic}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  actorDiffs: string[];
  /**
   * collection value on {@link ProbableWaffleReplayDesyncDiagnostic}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  playerDiffs: string[];
  /**
   * Optional string research diff carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat it according to
   * the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  researchDiff?: string;
  /**
   * Optional string campaign mission diff carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat it
   * according to the owning contract’s validation and presentation rules rather than assuming it is a stable
   * identifier.
   */
  campaignMissionDiff?: string;
  /**
   * Optional string campaign mission family diff carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat
   * it according to the owning contract’s validation and presentation rules rather than assuming it is a stable
   * identifier.
   */
  campaignMissionFamilyDiff?: string;
  /**
   * Optional string random diff carried by {@link ProbableWaffleReplayDesyncDiagnostic}. Treat it according to
   * the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  randomDiff?: string;
}

/**
 * Defines the structured campaign replay context contract for this module. Its declared surface makes campaign
 * id, mission id, mission revision, difficulty, progression snapshot explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignReplayContext {
  /**
   * stable campaign id used by {@link CampaignReplayContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly campaignId: CampaignId;
  /**
   * stable mission id used by {@link CampaignReplayContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly missionId: CampaignMissionId;
  /**
   * compatibility mission revision for {@link CampaignReplayContext}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly missionRevision: number;
  /**
   * difficulty value carried by {@link CampaignReplayContext}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly difficulty: "story" | "normal" | "hard";
  /**
   * progression snapshot value carried by {@link CampaignReplayContext}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly progressionSnapshot: CampaignMissionProgressionSnapshot;
  /**
   * Optional collection value on {@link CampaignReplayContext}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly participantProgressionSnapshots?: readonly CampaignParticipantProgressionSnapshot[];
}

/**
 * Defines the structured probable waffle replay debug data contract for this module. Its declared surface
 * makes tick digests, desync diagnostics explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleReplayDebugData {
  /**
   * collection value on {@link ProbableWaffleReplayDebugData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  tickDigests: ProbableWaffleReplayTickDigest[];
  /**
   * collection value on {@link ProbableWaffleReplayDebugData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  desyncDiagnostics: ProbableWaffleReplayDesyncDiagnostic[];
}

/**
 * Defines the structured probable waffle replay data contract for this module. Its declared surface makes
 * version, compatibility version, seed, map id, players explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleReplayData {
  /**
   * compatibility version for {@link ProbableWaffleReplayData}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  version: string;
  /**
   * compatibility compatibility version for {@link ProbableWaffleReplayData}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  compatibilityVersion: string;
  /**
   * numeric seed carried by {@link ProbableWaffleReplayData}. Its units and valid range are defined by {@link
   * ProbableWaffleReplayData} and must remain consistent across producers and consumers.
   */
  seed: number;
  /**
   * Optional stable map id used by {@link ProbableWaffleReplayData} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  mapId?: number;
  /**
   * collection value on {@link ProbableWaffleReplayData}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  players: ProbableWaffleReplayPlayerData[];
  /**
   * collection owned by {@link ProbableWaffleReplayData}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  commands: ProbableWaffleReplayCommandBatch[];
  /** Documents the campaign events member and its declared contract at this boundary. */
  campaignEvents?: CampaignMissionRuntimeEvent[];
  /** Documents the campaign mission initial state member and its declared contract at this boundary. */
  campaignMissionInitialState?: CampaignMissionRuntimeState;
  /**
   * Optional discriminator for {@link ProbableWaffleReplayData}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  randomInitialState?: DeterministicRandomState;
  /**
   * Optional human-facing campaign context for {@link ProbableWaffleReplayData}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  campaignContext?: CampaignReplayContext;
  /** Documents the debug data member and its declared contract at this boundary. */
  debugData?: ProbableWaffleReplayDebugData;
}

/**
 * Defines the structured game instance metadata start options contract for this module. Its declared surface
 * makes load from save, replay data explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface GameInstanceMetadataStartOptions {
  /**
   * Optional load from save value carried by {@link GameInstanceMetadataStartOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  loadFromSave?: boolean;
  /**
   * Optional replay data value carried by {@link GameInstanceMetadataStartOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  replayData?: ProbableWaffleReplayData;
}

/**
 * Defines the structured probable waffle game instance metadata data contract for this module. Its declared
 * surface makes type, visibility, name, start options, rnd seed explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleGameInstanceMetadataData extends GameInstanceMetadataData {
  /**
   * discriminator for {@link ProbableWaffleGameInstanceMetadataData}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  type: ProbableWaffleGameInstanceType;
  /**
   * visibility value carried by {@link ProbableWaffleGameInstanceMetadataData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  visibility: ProbableWaffleGameInstanceVisibility;
  /**
   * human-facing name for {@link ProbableWaffleGameInstanceMetadataData}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  name: string;
  /**
   * start options value carried by {@link ProbableWaffleGameInstanceMetadataData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  startOptions: GameInstanceMetadataStartOptions;
  /**
   * numeric rnd seed carried by {@link ProbableWaffleGameInstanceMetadataData}. Its units and valid range are
   * defined by {@link ProbableWaffleGameInstanceMetadataData} and must remain consistent across producers and
   * consumers.
   */
  rndSeed: number;
  /**
   * Optional stable current host user id used by {@link ProbableWaffleGameInstanceMetadataData} to correlate
   * this value with related records, events, or authored content; it is not a display label.
   */
  currentHostUserId?: string | null;
  /**
   * Optional human-facing campaign context for {@link ProbableWaffleGameInstanceMetadataData}. It supports UI,
   * narration, or diagnostics and must not be used as the stable identity of the record.
   */
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

/**
 * Defines the closed probable waffle game instance visibility classification. Use an explicit member rather
 * than a free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleGameInstanceVisibility {
  /**
   * Selects the `Public` case of {@link ProbableWaffleGameInstanceVisibility}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Public = "public",
  /**
   * Selects the `Private` case of {@link ProbableWaffleGameInstanceVisibility}. Use this explicit member when
   * the surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Private = "private"
}
