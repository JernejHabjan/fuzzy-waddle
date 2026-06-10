import { type GameInstanceId, type ProbableWaffleGameInstance } from "@fuzzy-waddle/api-interfaces";
import { type GameInstanceHolderServiceInterface } from "./game-instance-holder.service.interface";

export const gameInstanceHolderServiceStub = {
  openGameInstances: [] as ProbableWaffleGameInstance[],
  removeGameInstance(gameInstanceId: GameInstanceId): void {
    //
  },
  addGameInstance(gameInstance: ProbableWaffleGameInstance): void {
    //
  },
  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined {
    return undefined;
  }
} satisfies GameInstanceHolderServiceInterface;
