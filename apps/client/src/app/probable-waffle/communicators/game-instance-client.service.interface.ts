import {
  PositionPlayerDefinition,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData,
  ProbableWaffleLevelStateChangeEvent
} from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";

export interface GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;

  createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void>;
  stopGameInstance(): Promise<void>;
  startGame(): Promise<void>;
  joinToLobbyAsPlayer(gameInstanceId: string): Promise<void>;
  joinToLobbyAsSpectator(gameInstanceId: string): Promise<void>;
  stopGame(removeFrom: "local" | "localAndRemote"): Promise<void>;
  get gameLocalInstanceId(): string | null;
  gameModeChanged(gameModeData: ProbableWaffleGameModeData): Promise<void>;
  get listenToLevelStateChangeEvents(): Observable<ProbableWaffleLevelStateChangeEvent> | undefined;
  playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void>;
  playerLeftOrSlotClosed(playerNumber: number): Promise<void>;
  addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void>;
  addSelfAsSpectator(): Promise<void>;
  listenToGameFound(): Observable<ProbableWaffleGameFoundEvent>;
  requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void>;
  navigateToLobbyOrDirectlyToGame(): Promise<void>;
  getGameInstanceData(gameInstanceId: string): Promise<ProbableWaffleGameInstanceData | null>;
  addAiPlayer(): Promise<void>;
  addSelfAsPlayer(): Promise<void>;
}
