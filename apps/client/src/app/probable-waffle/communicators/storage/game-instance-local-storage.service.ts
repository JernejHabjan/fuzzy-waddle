import { Injectable } from "@angular/core";
import { GameInstanceStorageServiceInterface } from "./game-instance-storage.service.interface";
import { type ProbableWaffleGameInstanceSaveData } from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class GameInstanceLocalStorageService implements GameInstanceStorageServiceInterface {
  private readonly localStorageKey = "probable-waffle-game-instances";
  async saveToStorage(saveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    return this.saveToLocalStorage(saveData);
  }

  async getFromStorage(): Promise<ProbableWaffleGameInstanceSaveData[]> {
    return this.loadFromLocalStorage();
  }

  async deleteFromStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    this.deleteFromLocalStorage(gameInstanceSaveData);
  }

  private loadFromLocalStorage(): ProbableWaffleGameInstanceSaveData[] {
    try {
      return JSON.parse(localStorage.getItem(this.localStorageKey) || "[]");
    } catch (e) {
      console.error("Load from local storage", e);
      return [];
    }
  }

  private saveToLocalStorage(gameInstance: ProbableWaffleGameInstanceSaveData): void {
    const existingGameInstances = this.loadFromLocalStorage();
    existingGameInstances.push(gameInstance);
    localStorage.setItem(this.localStorageKey, JSON.stringify(existingGameInstances));
  }

  private deleteFromLocalStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData) {
    const existingGameInstances = this.loadFromLocalStorage();
    const index = existingGameInstances.findIndex(
      (gameInstance) =>
        gameInstance.gameInstanceData.gameInstanceMetadataData!.gameInstanceId ===
        gameInstanceSaveData.gameInstanceData.gameInstanceMetadataData!.gameInstanceId
    );
    if (index !== -1) {
      existingGameInstances.splice(index, 1);
      localStorage.setItem(this.localStorageKey, JSON.stringify(existingGameInstances));
    }
  }
}
