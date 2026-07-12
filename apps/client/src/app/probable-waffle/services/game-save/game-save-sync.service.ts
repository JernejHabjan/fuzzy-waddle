import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { environment } from "../../../../environments/environment";
import { GameSaveRepository } from "./game-save.repository";
import type { GameSaveRecord, ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";

interface RemoteGameSaveRecord {
  id: string;
  scope: GameSaveRecord["scope"];
  kind: GameSaveRecord["kind"];
  name: string | null;
  campaign_chapter_id: string | null;
  campaign_mission_id: string | null;
  campaign_run_id: string | null;
  revision: number;
  is_deleted: boolean;
  thumbnail: string | null;
  game_instance_data: ProbableWaffleGameInstanceData;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: "root" })
export class GameSaveSyncService {
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly repository = inject(GameSaveRepository);

  /** Local writes always win availability; sync failures leave their records queued for the next attempt. */
  async flush(): Promise<void> {
    if (!this.authService.isAuthenticated) return;
    await this.pullAndMerge();
    for (const save of await this.repository.listIncludingDeleted()) {
      if (save.syncState === "synced") continue;
      try {
        await this.uploadWithRetry({
          id: save.id,
          scope: save.scope,
          kind: save.kind,
          name: save.name,
          revision: save.revision,
          isDeleted: save.syncState === "deleted",
          thumbnail: save.thumbnail,
          gameInstanceData: save.gameInstanceData,
          campaignChapterId: save.campaign?.chapterId,
          campaignMissionId: save.campaign?.missionId,
          campaignRunId: save.campaign?.runId
        });
        if (save.syncState === "deleted") await this.repository.remove(save.id);
        else await this.repository.upsert({ ...save, syncState: "synced" });
      } catch {
        await this.repository.upsert({ ...save, syncState: "failed" });
      }
    }
  }

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
      if (localRecord && localRecord.revision > remote.revision) continue;
      if (remote.is_deleted) {
        await this.repository.remove(remote.id);
        continue;
      }
      const campaign =
        remote.scope === "campaign" &&
        remote.campaign_chapter_id &&
        remote.campaign_mission_id &&
        remote.campaign_run_id
          ? {
              chapterId: remote.campaign_chapter_id,
              missionId: remote.campaign_mission_id,
              runId: remote.campaign_run_id
            }
          : undefined;
      if (remote.scope === "campaign" && !campaign) continue;
      await this.repository.upsert({
        id: remote.id,
        formatVersion: 1,
        scope: remote.scope,
        kind: remote.kind,
        name: remote.name ?? undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
        revision: remote.revision,
        syncState: "synced",
        campaign,
        thumbnail: remote.thumbnail ?? undefined,
        gameInstanceData: remote.game_instance_data
      });
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
