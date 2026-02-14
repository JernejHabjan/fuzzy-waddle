import type {
  GameInstanceId,
  PlayerNumber,
  PositionPlayerDefinition,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData
} from "@fuzzy-waddle/api-interfaces";
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
  loadGameInstance(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
  saveGameInstance(data: Record<string, any>): Promise<void>;
  startReplay(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
  leaveLobby(): Promise<void>;
}
