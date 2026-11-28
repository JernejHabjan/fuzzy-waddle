import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { environment } from "@fuzzy-waddle/environments/environment";
import { GameSaveRepository } from "./game-save.repository";
import {
  GameSaveScope,
  GameSaveSyncState,
  type EncodedGameSaveRecord,
  type GameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveSyncServiceInterface } from "./game-save-sync.service.interface";
import type { RemoteGameSaveRecord } from "./remote-game-save-record";

@Injectable({ providedIn: "root" })
/** Defines the game save sync service contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class GameSaveSyncService implements GameSaveSyncServiceInterface {
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly repository = inject(GameSaveRepository);
  private flushInProgress?: Promise<void>;

  constructor() {
    // A save queued while offline must retry when connectivity returns even if the player does not save again.
    if (typeof window !== "undefined") window.addEventListener("online", this.flushOnReconnect);
    this.authService.sessionChanges?.subscribe((session) => {
      if (session) void this.flush();
    });
  }

  /** Documents the flush member and its declared contract at this boundary. */
  async flush(): Promise<void> {
    if (!this.authService.isAuthenticated) return;
    if (this.flushInProgress) return this.flushInProgress;
    this.flushInProgress = this.flushQueuedSaves();
    try {
      await this.flushInProgress;
    } finally {
      this.flushInProgress = undefined;
    }
  }

  /** Documents the flush queued saves member and its declared contract at this boundary. */
  private async flushQueuedSaves(): Promise<void> {
    await this.pullAndMerge();
    for (const save of await this.repository.listIncludingDeleted()) {
      if (save.syncState === GameSaveSyncState.Synced) continue;
      try {
        await this.uploadWithRetry({
          id: save.id,
          scope: save.scope,
          kind: save.kind,
          name: save.name,
          revision: save.revision,
          formatVersion: save.formatVersion,
          isDeleted: save.syncState === GameSaveSyncState.Deleted,
          thumbnail: save.thumbnail,
          encodedGameInstanceData: save.encodedGameInstanceData,
          campaignChapterId: save.campaign?.chapterId,
          campaignId: save.campaign?.campaignId,
          campaignMissionId: save.campaign?.missionId,
          campaignRunId: save.campaign?.runId,
          campaignMissionRevision: save.campaign?.missionRevision,
          campaignRuntimeSchemaVersion: save.campaign?.runtimeSchemaVersion,
          campaignProfileRevision: save.campaign?.profileRevision,
          campaignLoadoutIds: save.campaign?.selectedLoadoutIds,
          campaignLoadoutSnapshotHash: save.campaign?.loadoutSnapshotHash,
          campaignCheckpointId: save.campaign?.checkpointId,
          campaignParticipantCount: save.campaign?.participantCount,
          campaignParticipantProgressionSnapshots: save.campaign?.participantProgressionSnapshots
        });
        if (save.syncState === GameSaveSyncState.Deleted) await this.repository.remove(save.id);
        else await this.repository.upsert({ ...save, syncState: GameSaveSyncState.Synced });
      } catch {
        await this.repository.upsert({ ...save, syncState: GameSaveSyncState.Failed });
      }
    }
  }

  private readonly flushOnReconnect = (): void => {
    void this.flush();
  };

  /** Documents the pull and merge member and its declared contract at this boundary. */
  private async pullAndMerge(): Promise<void> {
    let remoteRecords: RemoteGameSaveRecord[];
    try {
      remoteRecords = await firstValueFrom(
        this.httpClient.get<RemoteGameSaveRecord[]>(`${environment.api}api/probable-waffle/game-saves`)
      );
    } catch {
      return;
    }
    const local = new Map((await this.repository.listIncludingDeleted()).map((record) => [record.id, record]));
    for (const remote of remoteRecords) {
      const localRecord = local.get(remote.id);
      if (
        localRecord &&
        (localRecord.revision > remote.revision ||
          (localRecord.revision === remote.revision && localRecord.updatedAt >= remote.updated_at))
      )
        continue;
      if (remote.is_deleted) {
        await this.repository.remove(remote.id);
        continue;
      }
      const campaign =
        remote.scope === GameSaveScope.Campaign &&
        remote.campaign_chapter_id &&
        remote.campaign_mission_id &&
        remote.campaign_run_id
          ? {
              ...(remote.campaign_id ? { campaignId: remote.campaign_id } : {}),
              chapterId: remote.campaign_chapter_id,
              missionId: remote.campaign_mission_id,
              runId: remote.campaign_run_id,
              ...(remote.campaign_mission_revision ? { missionRevision: remote.campaign_mission_revision } : {}),
              ...(remote.campaign_runtime_schema_version
                ? { runtimeSchemaVersion: remote.campaign_runtime_schema_version }
                : {}),
              ...(remote.campaign_profile_revision !== null
                ? { profileRevision: remote.campaign_profile_revision }
                : {}),
              selectedLoadoutIds: [...(remote.campaign_loadout_ids ?? [])].sort(),
              loadoutSnapshotHash: remote.campaign_loadout_snapshot_hash ?? "",
              ...(remote.campaign_checkpoint_id ? { checkpointId: remote.campaign_checkpoint_id } : {}),
              ...(remote.campaign_participant_count ? { participantCount: remote.campaign_participant_count } : {}),
              participantProgressionSnapshots: structuredClone(remote.campaign_participant_progression_snapshots ?? [])
            }
          : undefined;
      if (remote.scope === GameSaveScope.Campaign && !campaign) continue;
      const record: EncodedGameSaveRecord = {
        id: remote.id,
        formatVersion: remote.format_version,
        scope: remote.scope,
        kind: remote.kind,
        name: remote.name ?? undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
        revision: remote.revision,
        syncState: GameSaveSyncState.Synced,
        campaign,
        thumbnail: remote.thumbnail ?? undefined,
        encodedGameInstanceData: remote.encoded_game_instance_data
      };
      await this.repository.upsert(record);
    }
  }

  // payload.encodedGameInstanceData contains the full serialized game/campaign runtime state, so
  // this request can exceed Express/body-parser's default 100kb limit. The API endpoint
  // (GameSaveController) relies on a raised JSON body-size limit configured in apps/api/src/main.ts
  // (app.useBodyParser); if save sizes keep growing, that limit needs to grow (or saves need to be
  // compressed/diffed) alongside this upload.
  private async uploadWithRetry(payload: object): Promise<void> {
    let failure: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await firstValueFrom(this.httpClient.post(`${environment.api}api/probable-waffle/game-saves`, payload));
        return;
      } catch (error) {
        failure = error;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
    throw failure;
  }
}
