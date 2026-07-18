import { inject, Injectable } from "@angular/core";
import {
  type CampaignMissionId,
  type EncodedGameSaveRecord,
  GAME_SAVE_FORMAT_VERSION,
  GameSaveKind,
  type GameSaveRecord,
  GameSaveScope,
  GameSaveSyncState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveRepository } from "./game-save.repository";
import { GameSaveSyncService } from "./game-save-sync.service";
import { GameSaveCodecService } from "./game-save-codec.service";
import { GameSaveServiceInterface } from "./game-save.service.interface";
import type { SaveGameRequest } from "./save-game-request";
import { GameSavePort } from "@fuzzy-waddle/probable-waffle-gameplay";

@Injectable({ providedIn: "root" })
/** Owns decoded save operations while persistence and transport retain encoded payloads. */
export class GameSaveService extends GameSavePort implements GameSaveServiceInterface {
  private readonly repository = inject(GameSaveRepository);
  private readonly syncService = inject(GameSaveSyncService);
  private readonly codec = inject(GameSaveCodecService);

  async save(request: SaveGameRequest): Promise<GameSaveRecord> {
    const now = new Date().toISOString();
    const overwrite = request.overwriteSaveId
      ? (await this.repository.list()).find(
          (record) =>
            record.id === request.overwriteSaveId &&
            record.scope === request.scope &&
            record.kind === GameSaveKind.Manual &&
            this.hasMatchingSaveScope(record, request)
        )
      : request.kind === GameSaveKind.Quicksave
        ? (await this.repository.list()).find(
            (record) =>
              record.kind === GameSaveKind.Quicksave &&
              record.scope === request.scope &&
              this.hasMatchingSaveScope(record, request)
          )
        : undefined;
    const record: GameSaveRecord = {
      id: overwrite?.id ?? crypto.randomUUID(),
      formatVersion: GAME_SAVE_FORMAT_VERSION,
      scope: request.scope,
      kind: request.kind,
      name: request.name,
      createdAt: overwrite?.createdAt ?? now,
      updatedAt: now,
      revision: (overwrite?.revision ?? 0) + 1,
      syncState: GameSaveSyncState.Local,
      campaign: request.campaign,
      thumbnail: request.thumbnail,
      // JSON persistence below creates the durable value copy; keeping this assignment compatible with older test runtimes.
      gameInstanceData: request.gameInstanceData
    };
    await this.repository.upsert(await this.encodeRecord(record));
    await this.retainAutosaves(record);
    void this.syncService.flush();
    return record;
  }

  /** Prevents an overwrite choice from another mission or skirmish scope replacing the current game's save. */
  private hasMatchingSaveScope(record: EncodedGameSaveRecord, request: SaveGameRequest): boolean {
    if (record.scope === GameSaveScope.Skirmish) return request.scope === GameSaveScope.Skirmish;
    return (
      request.scope === GameSaveScope.Campaign &&
      record.campaign?.chapterId === request.campaign?.chapterId &&
      record.campaign?.missionId === request.campaign?.missionId
    );
  }

  async list(): Promise<GameSaveRecord[]> {
    const records = await this.repository.list();
    const decoded = await Promise.all(
      records.map(async (record) => {
        if (record.formatVersion !== GAME_SAVE_FORMAT_VERSION) return undefined;
        try {
          return await this.decodeRecord(record);
        } catch (error) {
          console.error(`Unable to decode save ${record.id}`, error);
          return undefined;
        }
      })
    );
    return decoded.filter((record): record is GameSaveRecord => Boolean(record));
  }

  async continueCampaignMission(missionId: CampaignMissionId): Promise<GameSaveRecord | undefined> {
    return (await this.list()).find(
      (record) => record.scope === GameSaveScope.Campaign && record.campaign?.missionId === missionId
    );
  }

  async rename(id: string, name: string): Promise<void> {
    const record = (await this.list()).find((candidate) => candidate.id === id);
    if (!record || record.kind !== GameSaveKind.Manual) return;
    const encoded = (await this.repository.list()).find((candidate) => candidate.id === id);
    if (!encoded) return;
    await this.repository.upsert({
      ...encoded,
      ...record,
      encodedGameInstanceData: encoded.encodedGameInstanceData,
      name,
      updatedAt: new Date().toISOString(),
      revision: record.revision + 1,
      syncState: GameSaveSyncState.Local
    });
    void this.syncService.flush();
  }

  async delete(id: string): Promise<void> {
    await this.repository.markDeleted(id);
    void this.syncService.flush();
  }

  /** Caps automatic snapshots per mission/run while preserving all named manual saves. */
  private async retainAutosaves(newest: GameSaveRecord): Promise<void> {
    if (newest.kind !== GameSaveKind.Autosave) return;
    const scopeKey =
      newest.scope === GameSaveScope.Campaign
        ? newest.campaign?.missionId
        : newest.gameInstanceData.gameInstanceMetadataData?.gameInstanceId;
    const autosaves = (await this.list()).filter(
      (record) =>
        record.kind === GameSaveKind.Autosave &&
        record.scope === newest.scope &&
        (record.scope === GameSaveScope.Campaign
          ? record.campaign?.missionId === scopeKey
          : record.gameInstanceData.gameInstanceMetadataData?.gameInstanceId === scopeKey)
    );
    await Promise.all(autosaves.slice(10).map((record) => this.delete(record.id)));
  }

  private async encodeRecord(record: GameSaveRecord): Promise<EncodedGameSaveRecord> {
    const { gameInstanceData, ...metadata } = record;
    return { ...metadata, encodedGameInstanceData: await this.codec.encode(gameInstanceData) };
  }

  private async decodeRecord(record: EncodedGameSaveRecord): Promise<GameSaveRecord> {
    const { encodedGameInstanceData, ...metadata } = record;
    return { ...metadata, gameInstanceData: await this.codec.decode(encodedGameInstanceData) };
  }
}
