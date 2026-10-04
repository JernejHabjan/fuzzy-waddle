import type { EncodedGameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";

/** Durable encoded save metadata repository. */
export abstract class GameSaveRepositoryInterface {
  abstract list(): Promise<EncodedGameSaveRecord[]>;
  abstract listIncludingDeleted(): Promise<EncodedGameSaveRecord[]>;
  abstract upsert(record: EncodedGameSaveRecord): Promise<void>;
  abstract markDeleted(id: string): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
