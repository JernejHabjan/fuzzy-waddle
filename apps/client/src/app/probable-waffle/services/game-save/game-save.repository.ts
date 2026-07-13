import { Injectable } from "@angular/core";
import { type EncodedGameSaveRecord, GameSaveSyncState } from "@fuzzy-waddle/api-interfaces";
import { GameSaveRepositoryInterface } from "./game-save.repository.interface";

const DATABASE_NAME = "probable-waffle-db";
const DATABASE_VERSION = 3;
const OBJECT_STORE_NAME = "game-saves";

@Injectable({ providedIn: "root" })
/** IndexedDB authority for searchable save metadata and encoded game-state payloads. */
export class GameSaveRepository implements GameSaveRepositoryInterface {
  async list(): Promise<EncodedGameSaveRecord[]> {
    const records = await this.read();
    return records
      .filter((record) => record.syncState !== GameSaveSyncState.Deleted)
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) ||
          b.revision - a.revision ||
          b.createdAt.localeCompare(a.createdAt) ||
          b.id.localeCompare(a.id)
      );
  }

  async listIncludingDeleted(): Promise<EncodedGameSaveRecord[]> {
    return this.read();
  }

  async upsert(record: EncodedGameSaveRecord): Promise<void> {
    await this.request("readwrite", (store) => store.put(record));
  }

  /** Tombstones are kept locally until remote synchronization confirms the deletion. */
  async markDeleted(id: string): Promise<void> {
    const records = await this.read();
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return;
    const current = records[index];
    if (!current) return;
    await this.upsert({ ...current, syncState: GameSaveSyncState.Deleted, revision: current.revision + 1 });
  }

  async remove(id: string): Promise<void> {
    await this.request("readwrite", (store) => store.delete(id));
  }

  private async read(): Promise<EncodedGameSaveRecord[]> {
    return this.request("readonly", (store) => store.getAll());
  }

  /** Opens the single save authority and removes the retired name-keyed store during upgrade. */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (request.result.objectStoreNames.contains("game-instances")) request.result.deleteObjectStore("game-instances");
        if (!request.result.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          request.result.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async request<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const database = await this.openDatabase();
    return new Promise<T>((resolve, reject) => {
      const request = operation(database.transaction(OBJECT_STORE_NAME, mode).objectStore(OBJECT_STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).finally(() => database.close());
  }
}
