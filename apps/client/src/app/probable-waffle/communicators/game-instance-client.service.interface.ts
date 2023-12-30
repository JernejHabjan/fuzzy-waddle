import {
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility
} from "@fuzzy-waddle/api-interfaces";

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
}
