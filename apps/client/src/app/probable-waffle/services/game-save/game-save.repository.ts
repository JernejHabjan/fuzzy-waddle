import { Injectable } from "@angular/core";
import type { GameSaveRecord } from "@fuzzy-waddle/api-interfaces";

const STORAGE_KEY = "probable-waffle-game-saves-v1";

@Injectable({ providedIn: "root" })
export class GameSaveRepository {
  async list(): Promise<GameSaveRecord[]> {
    const records = this.read();
    return records
      .filter((record) => record.syncState !== "deleted")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listIncludingDeleted(): Promise<GameSaveRecord[]> {
    return this.read();
  }

  async upsert(record: GameSaveRecord): Promise<void> {
    const records = this.read();
    const index = records.findIndex((candidate) => candidate.id === record.id);
    if (index === -1) records.push(record);
    else records[index] = record;
    this.write(records);
  }

  /** Tombstones are kept locally until remote synchronization confirms the deletion. */
  async markDeleted(id: string): Promise<void> {
    const records = this.read();
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return;
    records[index] = { ...records[index], syncState: "deleted", revision: records[index].revision + 1 };
    this.write(records);
  }

  private read(): GameSaveRecord[] {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? (JSON.parse(value) as GameSaveRecord[]) : [];
    } catch {
      return [];
    }
  }

  private write(records: GameSaveRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}
