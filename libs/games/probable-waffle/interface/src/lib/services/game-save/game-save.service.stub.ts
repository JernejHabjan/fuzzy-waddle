import {
  isSupportedGameSaveRecord,
  type CampaignMissionId,
  type GameSaveListEntry,
  type GameSaveRecord,
  GameSaveKind,
  ProbableWaffleGameInstanceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveServiceInterface } from "./game-save.service.interface";
import type { SaveGameRequest } from "./save-game-request";

/** Defines the game save service stub contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class GameSaveServiceStub extends GameSaveServiceInterface {
  records: GameSaveListEntry[] = [];
  override async save(_request: SaveGameRequest): Promise<GameSaveRecord> {
    throw new Error("Configure GameSaveServiceStub.save for this test");
  }
  override async list(): Promise<GameSaveListEntry[]> {
    return this.records;
  }
  override async continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined> {
    return this.records
      .filter(isSupportedGameSaveRecord)
      .find(
        (record) =>
          record.kind !== GameSaveKind.Archive &&
          record.campaign?.missionId === missionId &&
          record.gameInstanceData.gameInstanceMetadataData?.type !== ProbableWaffleGameInstanceType.Replay
      );
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
