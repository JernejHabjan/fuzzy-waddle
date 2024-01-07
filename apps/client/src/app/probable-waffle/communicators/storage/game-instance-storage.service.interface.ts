import { ProbableWaffleGameInstanceSaveData } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceStorageServiceInterface {
  saveToStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
  getFromStorage(): Promise<ProbableWaffleGameInstanceSaveData[]>;
  deleteFromStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void>;
}
