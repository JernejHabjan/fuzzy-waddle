import {
  PositionPlayerDefinition,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
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
  gameModeChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    gameModeData: ProbableWaffleGameModeData
  ): Promise<void>;
  playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void>;
  playerLeftOrSlotClosed(playerNumber: number): Promise<void>;
  addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void>;
  addSelfAsSpectator(): Promise<void>;
  listenToGameFound(): Observable<ProbableWaffleGameFoundEvent>;
  requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void>;
  stopRequestGameSearchForMatchmaking(): Promise<void>;
  navigateToLobbyOrDirectlyToGame(): Promise<void>;
  getGameInstanceData(gameInstanceId: string): Promise<ProbableWaffleGameInstanceData | null>;
  addAiPlayer(): Promise<void>;
  addSelfAsPlayer(): Promise<void>;
}
