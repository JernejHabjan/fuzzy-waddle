import type { GameInstanceId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type {
  PositionPlayerDefinition,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData
} from "@fuzzy-waddle/probable-waffle-protocol";
import { Observable, Subject } from "rxjs";
import type { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking-options";

/**
 * Defines the structured game instance client service interface contract for this module. Its declared surface
 * makes game instance, game instance to game component communicator, create game instance, stop game instance,
 * disconnect self from current game explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface GameInstanceClientServiceInterface {
  /**
   * Optional game instance value carried by {@link GameInstanceClientServiceInterface}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  gameInstance?: ProbableWaffleGameInstance;
  /**
   * game instance to game component communicator value carried by {@link GameInstanceClientServiceInterface}.
   * Its declared type is the compatibility boundary for producers, validators, and consumers; do not replace it
   * with a broader inferred shape.
   */
  gameInstanceToGameComponentCommunicator: Subject<"refresh">;

  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  stopGameInstance(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  disconnectSelfFromCurrentGame(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  startGame(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: GameInstanceId): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  joinGameInstanceAsPlayer(gameInstanceId: GameInstanceId): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  joinGameInstanceAsSpectator(gameInstanceId: GameInstanceId): Promise<void>;
  /**
   * stable current game instance id used by {@link GameInstanceClientServiceInterface} to correlate this value
   * with related records, events, or authored content; it is not a display label.
   */
  get currentGameInstanceId(): string | null;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  gameModeChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    gameModeData: ProbableWaffleGameModeData
  ): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  removePlayer(playerNumber: PlayerNumber): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  addSelfAsSpectator(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  getGameFoundListener(): Promise<Observable<ProbableWaffleGameFoundEvent>>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  stopRequestGameSearchForMatchmaking(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  navigateToLobbyOrDirectlyToGame(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  getGameInstanceData(gameInstanceId: GameInstanceId): Promise<ProbableWaffleGameInstanceData | null>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  addAiPlayer(position?: number, overrides?: Partial<PositionPlayerDefinition>): Promise<PositionPlayerDefinition>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  addSelfAsPlayer(overrides?: Partial<PositionPlayerDefinition>): Promise<PositionPlayerDefinition>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  loadSavedGameData(
    gameInstanceData: ProbableWaffleGameInstanceData,
    campaignSaveContext?: import("@fuzzy-waddle/probable-waffle-protocol").CampaignGameSaveContext
  ): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  saveGameInstance(data: Record<string, any>): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  requestCheckpointAutosave(checkpointId: string): void;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  startReplay(gameInstanceData: ProbableWaffleGameInstanceData): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  leaveLobby(): Promise<void>;
  /**
   * operation exposed by {@link GameInstanceClientServiceInterface}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  leaveScoreScreen(navigateHome?: boolean): Promise<void>;
}
