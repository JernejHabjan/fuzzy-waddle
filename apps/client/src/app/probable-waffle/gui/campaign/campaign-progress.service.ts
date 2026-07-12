import { Injectable, computed, signal } from "@angular/core";
import type {
  CampaignCatalog,
  CampaignMissionId,
  CampaignMissionProgress,
  CampaignProgressData
} from "@fuzzy-waddle/api-interfaces";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";

const EMPTY_PROGRESS: CampaignProgressData = { completedMissions: [] };

@Injectable({ providedIn: "root" })
export class CampaignProgressService {
  private readonly catalog = AOTA_CAMPAIGN_CATALOG;
  private readonly progress = signal<CampaignProgressData>(EMPTY_PROGRESS);

  readonly missionProgress = computed(() => this.resolveMissionProgress(this.catalog, this.progress()));
  readonly recommendedMission = computed(
    () =>
      this.missionProgress().find((entry) => entry.state === "available") ??
      this.missionProgress().find((entry) => entry.state === "inProgress")
  );

  setProgress(progress: CampaignProgressData): void {
    this.progress.set(progress);
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
}
