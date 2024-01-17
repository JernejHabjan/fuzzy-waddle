import { Injectable } from "@angular/core";
import { GameInstanceStorageServiceInterface } from "./game-instance-storage.service.interface";
import { ProbableWaffleGameInstanceSaveData } from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class GameInstanceIndexeddbStorageService implements GameInstanceStorageServiceInterface {
  private readonly dbName = "probable-waffle-db";
  private readonly objectStoreName = "game-instances";
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName);

      request.onerror = (event) => {
        console.error("Error opening IndexedDB:", (event.target as IDBOpenDBRequest).error);
        reject();
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.objectStoreName, { keyPath: "saveName" });
      };
    });
  }

  private getObjectStore(mode: IDBTransactionMode = "readwrite"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const transaction = this.db.transaction(this.objectStoreName, mode);
    return transaction.objectStore(this.objectStoreName);
  }

  async saveToStorage(saveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    const objectStore = this.getObjectStore();
    await new Promise<void>((resolve, reject) => {
      const request = objectStore.add(saveData);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getFromStorage(): Promise<ProbableWaffleGameInstanceSaveData[]> {
    const objectStore = this.getObjectStore("readonly");
    return new Promise<ProbableWaffleGameInstanceSaveData[]>((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result as ProbableWaffleGameInstanceSaveData[]);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async deleteFromStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    const objectStore = this.getObjectStore();
    await new Promise<void>((resolve, reject) => {
      const request = objectStore.delete(
        gameInstanceSaveData.gameInstanceData.gameInstanceMetadataData!.gameInstanceId!
      );

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }
}
