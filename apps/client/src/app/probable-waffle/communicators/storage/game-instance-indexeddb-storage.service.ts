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
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      // Already initialized, return the existing promise
      return this.initializationPromise as Promise<void>;
    }

    // Not initialized, create a new promise
    this.initializationPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName);

      request.onerror = (event) => {
        console.error("Error opening IndexedDB:", (event.target as IDBOpenDBRequest).error);
        reject();
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.objectStoreName, { keyPath: "saveName" });
      };
    });

    return this.initializationPromise;
  }

  private getObjectStore(mode: IDBTransactionMode = "readwrite"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const transaction = this.db.transaction(this.objectStoreName, mode);
    return transaction.objectStore(this.objectStoreName);
  }

  async saveToStorage(saveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    await this.initializeDatabase();
    const objectStore = this.getObjectStore();
    await new Promise<void>((resolve, reject) => {
      const request = objectStore.add(saveData);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getFromStorage(): Promise<ProbableWaffleGameInstanceSaveData[]> {
    await this.initializeDatabase();
    const objectStore = this.getObjectStore("readonly");
    return new Promise<ProbableWaffleGameInstanceSaveData[]>((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result as ProbableWaffleGameInstanceSaveData[]);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async deleteFromStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    await this.initializeDatabase();
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
