import { type GameInstanceId, type ProbableWaffleGameInstance } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceHolderServiceInterface {
  readonly openGameInstances: ProbableWaffleGameInstance[];
  removeGameInstance(gameInstanceId: GameInstanceId): void;
  addGameInstance(gameInstance: ProbableWaffleGameInstance): void;
  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined;
}
