import { Injectable, inject } from "@angular/core";
import type {
  CampaignChapterId,
  CampaignMissionId,
  GameSaveRecord,
  ProbableWaffleGameInstanceData
} from "@fuzzy-waddle/api-interfaces";
import { GameSaveRepository } from "./game-save.repository";
import { GameSaveSyncService } from "./game-save-sync.service";

export interface SaveGameRequest {
  scope: "campaign" | "skirmish";
  kind: "manual" | "autosave";
  name?: string;
  thumbnail?: string;
  gameInstanceData: ProbableWaffleGameInstanceData;
  campaign?: { chapterId: CampaignChapterId; missionId: CampaignMissionId; runId: string };
}

@Injectable({ providedIn: "root" })
export class GameSaveService {
  private readonly repository = inject(GameSaveRepository);
  private readonly syncService = inject(GameSaveSyncService);

  async save(request: SaveGameRequest): Promise<GameSaveRecord> {
    const now = new Date().toISOString();
    const record: GameSaveRecord = {
      id: crypto.randomUUID(),
      formatVersion: 1,
      scope: request.scope,
      kind: request.kind,
      name: request.name,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      syncState: "local",
      campaign: request.campaign,
      thumbnail: request.thumbnail,
      // JSON persistence below creates the durable value copy; keeping this assignment compatible with older test runtimes.
      gameInstanceData: request.gameInstanceData
    };
    await this.repository.upsert(record);
    await this.retainAutosaves(record);
    void this.syncService.flush();
    return record;
  }

  async list(): Promise<GameSaveRecord[]> {
    return this.repository.list();
  }

  async continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined> {
    return (await this.list()).find(
      (record) => record.scope === "campaign" && record.campaign?.missionId === missionId
    );
  }

  async rename(id: string, name: string): Promise<void> {
    const record = (await this.list()).find((candidate) => candidate.id === id);
    if (!record || record.kind !== "manual") return;
    await this.repository.upsert({
      ...record,
      name,
      updatedAt: new Date().toISOString(),
      revision: record.revision + 1,
      syncState: "local"
    });
    void this.syncService.flush();
  }

  async delete(id: string): Promise<void> {
    await this.repository.markDeleted(id);
    void this.syncService.flush();
  }

  /** Caps automatic snapshots per mission/run while preserving all named manual saves. */
  private async retainAutosaves(newest: GameSaveRecord): Promise<void> {
    if (newest.kind !== "autosave") return;
    const scopeKey =
      newest.scope === "campaign"
        ? newest.campaign?.missionId
        : newest.gameInstanceData.gameInstanceMetadataData?.gameInstanceId;
    const autosaves = (await this.list()).filter(
      (record) =>
        record.kind === "autosave" &&
        record.scope === newest.scope &&
        (record.scope === "campaign"
          ? record.campaign?.missionId === scopeKey
          : record.gameInstanceData.gameInstanceMetadataData?.gameInstanceId === scopeKey)
    );
    await Promise.all(autosaves.slice(10).map((record) => this.delete(record.id)));
  }
}
