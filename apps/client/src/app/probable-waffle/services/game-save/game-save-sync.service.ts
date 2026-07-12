import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { environment } from "../../../../environments/environment";
import { GameSaveRepository } from "./game-save.repository";

@Injectable({ providedIn: "root" })
export class GameSaveSyncService {
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly repository = inject(GameSaveRepository);

  /** Local writes always win availability; sync failures leave their records queued for the next attempt. */
  async flush(): Promise<void> {
    if (!this.authService.isAuthenticated) return;
    for (const save of await this.repository.listIncludingDeleted()) {
      if (save.syncState === "synced") continue;
      try {
        await firstValueFrom(
          this.httpClient.post(`${environment.api}api/probable-waffle/game-saves`, {
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
          })
        );
        await this.repository.upsert({ ...save, syncState: "synced" });
      } catch {
        await this.repository.upsert({ ...save, syncState: "failed" });
      }
    }
  }
}
