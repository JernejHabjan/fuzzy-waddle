import {
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
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { Observable } from "rxjs";

export interface GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;

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
  listenToGameFound(): Observable<ProbableWaffleGameFoundEvent>;
  requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void>;
  stopRequestGameSearchForMatchmaking(): Promise<void>;
  navigateToLobbyOrDirectlyToGame(): Promise<void>;
  getGameInstanceData(gameInstanceId: string): Promise<ProbableWaffleGameInstanceData | null>;
  addAiPlayer(): Promise<void>;
  addSelfAsPlayer(): Promise<void>;
  loadGameInstance(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
  saveGameInstance(saveName: string): Promise<void>;
  startReplay(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
}
