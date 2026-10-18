import { type GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import { type ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";

export interface GameInstanceHolderServiceInterface {
  readonly openGameInstances: ProbableWaffleGameInstance[];
  removeGameInstance(gameInstanceId: GameInstanceId): void;
  addGameInstance(gameInstance: ProbableWaffleGameInstance): void;
  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined;
}
