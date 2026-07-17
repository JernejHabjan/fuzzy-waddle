import type { CampaignMissionId, GameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveServiceInterface } from "./game-save.service.interface";
import type { SaveGameRequest } from "./save-game-request";

/** Configurable in-memory save service used by UI specs. */
export class GameSaveServiceStub extends GameSaveServiceInterface {
  records: GameSaveRecord[] = [];
  override async save(_request: SaveGameRequest): Promise<GameSaveRecord> {
    throw new Error("Configure GameSaveServiceStub.save for this test");
  }
  override async list(): Promise<GameSaveRecord[]> {
    return this.records;
  }
  override async continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined> {
    return this.records.find((record) => record.campaign?.missionId === missionId);
  }
  override async rename(id: string, name: string): Promise<void> {
    this.records = this.records.map((record) => (record.id === id ? { ...record, name } : record));
  }
  override async delete(id: string): Promise<void> {
    this.records = this.records.filter((record) => record.id !== id);
  }
}
