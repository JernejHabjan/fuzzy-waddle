import type { GameInstanceId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { PositionPlayerDefinition, ProbableWaffleDataChangeEventProperty, ProbableWaffleGameFoundEvent, ProbableWaffleGameInstance, ProbableWaffleGameInstanceData, ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility, ProbableWaffleGameModeData } from "@fuzzy-waddle/probable-waffle-protocol";
import { Observable, Subject } from "rxjs";
import type { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking-options";

export interface GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;
  gameInstanceToGameComponentCommunicator: Subject<"refresh">;

  createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void>;
  stopGameInstance(): Promise<void>;
  disconnectSelfFromCurrentGame(): Promise<void>;
  startGame(): Promise<void>;
  joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: GameInstanceId): Promise<void>;
  joinGameInstanceAsPlayer(gameInstanceId: GameInstanceId): Promise<void>;
  joinGameInstanceAsSpectator(gameInstanceId: GameInstanceId): Promise<void>;
  get currentGameInstanceId(): string | null;
  gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ): Promise<void>;
  gameModeChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    gameModeData: ProbableWaffleGameModeData
  ): Promise<void>;
  playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void>;
  removePlayer(playerNumber: PlayerNumber): Promise<void>;
  addSelfAsSpectator(): Promise<void>;
  getGameFoundListener(): Promise<Observable<ProbableWaffleGameFoundEvent>>;
  requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void>;
  stopRequestGameSearchForMatchmaking(): Promise<void>;
  navigateToLobbyOrDirectlyToGame(): Promise<void>;
  getGameInstanceData(gameInstanceId: GameInstanceId): Promise<ProbableWaffleGameInstanceData | null>;
  addAiPlayer(): Promise<PositionPlayerDefinition>;
  addSelfAsPlayer(): Promise<PositionPlayerDefinition>;
  loadSavedGameData(gameInstanceData: ProbableWaffleGameInstanceData): Promise<void>;
  saveGameInstance(data: Record<string, any>): Promise<void>;
  requestCheckpointAutosave(checkpointId: string): void;
  startReplay(gameInstanceData: ProbableWaffleGameInstanceData): Promise<void>;
  leaveLobby(): Promise<void>;
  leaveScoreScreen(navigateHome?: boolean): Promise<void>;
}
