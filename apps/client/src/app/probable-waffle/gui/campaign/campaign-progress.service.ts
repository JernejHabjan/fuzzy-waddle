import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import type {
  CampaignCatalog,
  CampaignMissionId,
  CampaignMissionProgress,
  CampaignProgressData
} from "@fuzzy-waddle/api-interfaces";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { AuthService } from "../../../auth/auth.service";
import { environment } from "../../../../environments/environment";

const EMPTY_PROGRESS: CampaignProgressData = { completedMissions: [] };
const GUEST_PROGRESS_KEY = "aota-campaign-progress-v1";

@Injectable({ providedIn: "root" })
export class CampaignProgressService {
  private readonly catalog = AOTA_CAMPAIGN_CATALOG;
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly progress = signal<CampaignProgressData>(this.readGuestProgress());

  readonly missionProgress = computed(() => this.resolveMissionProgress(this.catalog, this.progress()));
  readonly recommendedMission = computed(
    () =>
      this.missionProgress().find((entry) => entry.state === "available") ??
      this.missionProgress().find((entry) => entry.state === "inProgress")
  );

  setProgress(progress: CampaignProgressData): void {
    this.progress.set(progress);
  }

  async load(): Promise<void> {
    const guest = this.readGuestProgress();
    if (!this.authService.isAuthenticated) {
      this.progress.set(guest);
      return;
    }
    try {
      const remote = await firstValueFrom(
        this.httpClient.get<CampaignProgressData>(`${environment.api}api/probable-waffle/campaign/progress`)
      );
      this.progress.set(this.mergeProgress(guest, remote));
    } catch {
      this.progress.set(guest);
    }
  }

  async startRun(missionId: CampaignMissionId): Promise<string> {
    const runId = crypto.randomUUID();
    if (this.authService.isAuthenticated) {
      try {
        await firstValueFrom(
          this.httpClient.post(`${environment.api}api/probable-waffle/campaign/runs`, { runId, missionId })
        );
      } catch {
        // Keep the local run playable while offline.
      }
    }
    return runId;
  }

  async recordResult(result: {
    runId: string;
    missionId: CampaignMissionId;
    outcome: "victory" | "defeat" | "abandoned";
  }): Promise<void> {
    if (result.outcome === "victory") {
      const merged = this.mergeProgress(this.progress(), {
        completedMissions: [{ missionId: result.missionId, completedAt: new Date().toISOString() }]
      });
      this.progress.set(merged);
      localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(merged));
    }
    if (this.authService.isAuthenticated) {
      try {
        await firstValueFrom(this.httpClient.post(`${environment.api}api/probable-waffle/campaign/results`, result));
      } catch {
        // Local completion is retained for the next merge opportunity.
      }
    }
  }

  getMissionProgress(missionId: CampaignMissionId): CampaignMissionProgress | undefined {
    return this.missionProgress().find((entry) => entry.mission.id === missionId);
  }

  /** Resolves unlocks only from stable mission IDs, so title edits cannot affect player progress. */
  private resolveMissionProgress(catalog: CampaignCatalog, progress: CampaignProgressData): CampaignMissionProgress[] {
    const completions = new Map(progress.completedMissions.map((completion) => [completion.missionId, completion]));
    const missions = catalog.chapters.flatMap((chapter) => chapter.missions);

    return missions.map((mission) => {
      const completion = completions.get(mission.id);
      if (completion) {
        return { mission, state: "completed", completedAt: completion.completedAt };
      }

      if (mission.availability === "planned") {
        return { mission, state: "planned" };
      }

      const unlocked = mission.prerequisites.every((prerequisite) => completions.has(prerequisite));
      return { mission, state: unlocked ? "available" : "locked" };
    });
  }

  private mergeProgress(left: CampaignProgressData, right: CampaignProgressData): CampaignProgressData {
    const completions = new Map<string, string>();
    for (const completion of [...left.completedMissions, ...right.completedMissions]) {
      const current = completions.get(completion.missionId);
      if (!current || completion.completedAt < current) completions.set(completion.missionId, completion.completedAt);
    }
    return { completedMissions: [...completions].map(([missionId, completedAt]) => ({ missionId, completedAt })) };
  }

  private readGuestProgress(): CampaignProgressData {
    try {
      return JSON.parse(localStorage.getItem(GUEST_PROGRESS_KEY) ?? "null") ?? EMPTY_PROGRESS;
    } catch {
      return EMPTY_PROGRESS;
    }
  }
}
