import type { EncodedGameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveRepositoryInterface } from "./game-save.repository.interface";

/** In-memory repository for component and service tests. */
export class GameSaveRepositoryStub extends GameSaveRepositoryInterface {
  records: EncodedGameSaveRecord[] = [];
  override async list(): Promise<EncodedGameSaveRecord[]> {
    return this.records;
  }
  override async listIncludingDeleted(): Promise<EncodedGameSaveRecord[]> {
    return this.records;
  }
  override async upsert(record: EncodedGameSaveRecord): Promise<void> {
    this.records = [...this.records.filter((candidate) => candidate.id !== record.id), record];
  }
  override async markDeleted(id: string): Promise<void> {
    this.records = this.records.filter((record) => record.id !== id);
  }
  override async remove(id: string): Promise<void> {
    this.records = this.records.filter((record) => record.id !== id);
  }
}
