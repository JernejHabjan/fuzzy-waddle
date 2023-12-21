import { ProbableWaffleGameInstance } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;

  createGameInstance(joinable: boolean): Promise<void>;

  stopGameInstance(): Promise<void>;

  startGame(): Promise<void>;

  joinToLobbyAsPlayer(gameInstanceId: string): Promise<void>;

  joinToLobbyAsSpectator(gameInstanceId: string): Promise<void>;

  stopGame(removeFrom: "local" | "localAndRemote"): Promise<void>;

  get gameLocalInstanceId(): string | null;
}
