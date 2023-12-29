import { ProbableWaffleGameInstance, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;

  createGameInstance(joinable: boolean, type: ProbableWaffleGameInstanceType): Promise<void>;

  stopGameInstance(): Promise<void>;

  startGame(): Promise<void>;

  joinToLobbyAsPlayer(gameInstanceId: string): Promise<void>;

  joinToLobbyAsSpectator(gameInstanceId: string): Promise<void>;

  stopGame(removeFrom: "local" | "localAndRemote"): Promise<void>;

  get gameLocalInstanceId(): string | null;
}
