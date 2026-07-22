import {
  isSupportedGameSaveRecord,
  type CampaignMissionId,
  type GameSaveListEntry,
  type GameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveServiceInterface } from "./game-save.service.interface";
import type { SaveGameRequest } from "./save-game-request";

/** Configurable in-memory save service used by UI specs. */
export class GameSaveServiceStub extends GameSaveServiceInterface {
  records: GameSaveListEntry[] = [];
  override async save(_request: SaveGameRequest): Promise<GameSaveRecord> {
    throw new Error("Configure GameSaveServiceStub.save for this test");
  }
  override async list(): Promise<GameSaveListEntry[]> {
    return this.records;
  }
  override async continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined> {
    return this.records.filter(isSupportedGameSaveRecord).find((record) => record.campaign?.missionId === missionId);
  }
  override async rename(id: string, name: string): Promise<void> {
    this.records = this.records.map((record) => (record.id === id ? { ...record, name } : record));
  }
  override async delete(id: string): Promise<void> {
    this.records = this.records.filter((record) => record.id !== id);
  }
  override async exportSave(id: string): Promise<string | undefined> {
    const record = this.records.find((candidate) => candidate.id === id);
    return record ? JSON.stringify(record) : undefined;
  }
}
