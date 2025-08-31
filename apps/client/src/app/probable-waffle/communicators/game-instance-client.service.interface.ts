import type {
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
import { type MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { Observable, Subject } from "rxjs";

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
  joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: string): Promise<void>;
  joinGameInstanceAsPlayer(gameInstanceId: string): Promise<void>;
  joinGameInstanceAsSpectator(gameInstanceId: string): Promise<void>;
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
  removePlayer(playerNumber: number): Promise<void>;
  addSelfAsSpectator(): Promise<void>;
  getGameFoundListener(): Promise<Observable<ProbableWaffleGameFoundEvent>>;
  requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void>;
  stopRequestGameSearchForMatchmaking(): Promise<void>;
  navigateToLobbyOrDirectlyToGame(): Promise<void>;
  getGameInstanceData(gameInstanceId: string): Promise<ProbableWaffleGameInstanceData | null>;
  addAiPlayer(): Promise<PositionPlayerDefinition>;
  addSelfAsPlayer(): Promise<PositionPlayerDefinition>;
  loadGameInstance(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
  saveGameInstance(data: Record<string, any>): Promise<void>;
  startReplay(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
}
