import { ProbableWaffleGameInstanceSaveData } from "@fuzzy-waddle/api-interfaces";

export abstract class GameInstanceStorageServiceInterface {
  abstract saveToStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
  abstract getFromStorage(): Promise<ProbableWaffleGameInstanceSaveData[]>;
  abstract deleteFromStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
}
