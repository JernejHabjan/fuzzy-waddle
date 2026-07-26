import { computed, inject, Injectable } from "@angular/core";
import {
  type CampaignCatalog,
  type CampaignMissionId,
  type CampaignMissionProgress,
  type CampaignProgressData,
  type CampaignVictoryCommitRequest
} from "@fuzzy-waddle/probable-waffle-protocol";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { environment } from "@fuzzy-waddle/environments/environment";
import { CampaignProgressServiceInterface } from "./campaign-progress.service.interface";
import { CampaignProfileService } from "./campaign-profile.service";

@Injectable({ providedIn: "root" })
/** Defines the campaign progress service contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignProgressService implements CampaignProgressServiceInterface {
  private readonly catalog = AOTA_CAMPAIGN_CATALOG;
  private readonly profileService = inject(CampaignProfileService);
  private readonly progress = computed<CampaignProgressData>(() => ({
    completedMissions: [...this.profileService.profileData().completedMissions]
  }));

  readonly missionProgress = computed(() => this.resolveMissionProgress(this.catalog, this.progress()));
  readonly recommendedMission = computed(
    () =>
      this.missionProgress().find((entry) => entry.state === "available") ??
      this.missionProgress().find((entry) => entry.state === "inProgress")
  );

  async load(): Promise<void> {
    await this.profileService.load();
  }

  async startRun(missionId: CampaignMissionId): Promise<string> {
    // Keep the local run playable while offline.
    return (await this.profileService.startRun(missionId)).runId;
  }

  async recordResult(result: CampaignVictoryCommitRequest): Promise<void> {
    // Local completion is retained for the next merge opportunity.
    await this.profileService.commitVictory(result);
  }

  getMissionProgress(missionId: CampaignMissionId): CampaignMissionProgress | undefined {
    return this.missionProgress().find((entry) => entry.mission.id === missionId);
  }

  /** Documents the resolve mission progress member and its declared contract at this boundary. */
  private resolveMissionProgress(catalog: CampaignCatalog, progress: CampaignProgressData): CampaignMissionProgress[] {
    const completions = new Map(progress.completedMissions.map((completion) => [completion.missionId, completion]));
    const missions = catalog.chapters.flatMap((chapter) => chapter.missions);

    return missions.map((mission) => {
      const completion = completions.get(mission.id);
      if (completion) {
        return { mission, state: "completed", completedAt: completion.completedAt };
      }

      // Development builds expose the complete campaign for rapid UI and mission testing without fabricated progress.
      if (!environment.production) {
        return { mission, state: "available" };
      }

      if (mission.availability === "planned") {
        return { mission, state: "planned" };
      }

      const unlocked = mission.prerequisites.every((prerequisite) => completions.has(prerequisite));
      return { mission, state: unlocked ? "available" : "locked" };
    });
  }
}
