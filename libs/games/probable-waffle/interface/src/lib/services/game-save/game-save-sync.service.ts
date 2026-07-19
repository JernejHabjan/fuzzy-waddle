import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { environment } from "@fuzzy-waddle/environments/environment";
import { GameSaveRepository } from "./game-save.repository";
import {
  GAME_SAVE_FORMAT_VERSION,
  GameSaveScope,
  GameSaveSyncState,
  type EncodedGameSaveRecord,
  type GameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveSyncServiceInterface } from "./game-save-sync.service.interface";
import type { RemoteGameSaveRecord } from "./remote-game-save-record";

@Injectable({ providedIn: "root" })
/** Reconciles encoded offline saves with the authenticated backend using revisions and tombstones. */
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

  /** Local writes always win availability; sync failures leave their records queued for the next attempt. */
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

  /** A single flush owns reconciliation so overlapping saves or reconnects cannot upload the same revision twice. */
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
          campaignMissionId: save.campaign?.missionId,
          campaignRunId: save.campaign?.runId
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

  /** Server revisions win only for the same save id; independent local saves are preserved. */
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
              chapterId: remote.campaign_chapter_id,
              missionId: remote.campaign_mission_id,
              runId: remote.campaign_run_id
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
