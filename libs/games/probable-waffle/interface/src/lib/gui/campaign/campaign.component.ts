import { ChangeDetectionStrategy, Component, computed, inject, type OnInit } from "@angular/core";
import type { CampaignChapterId } from "@fuzzy-waddle/probable-waffle-protocol";
import { Router } from "@angular/router";

import { HomeNavComponent } from "@fuzzy-waddle/platform-identity/client/home-nav/home-nav.component";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { ChapterCardComponent } from "./chapter-card/chapter-card.component";
import type { CampaignChapterCardState } from "./chapter-card/campaign-chapter-card-state";
import { CampaignProgressService } from "./campaign-progress.service";

@Component({
  selector: "fuzzy-waddle-campaign",
  templateUrl: "./campaign.component.html",
  styleUrls: ["./campaign.component.scss"],
  imports: [HomeNavComponent, ChapterCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignComponent implements OnInit {
  private readonly campaignProgressService = inject(CampaignProgressService);
  private readonly router = inject(Router);
  protected readonly catalog = AOTA_CAMPAIGN_CATALOG;
  protected readonly recommendedMission = this.campaignProgressService.recommendedMission;
  protected readonly chapterStates = computed(() =>
    this.catalog.chapters.map((chapter) => {
      const progress = this.campaignProgressService
        .missionProgress()
        .filter((missionProgress) => missionProgress.mission.chapterId === chapter.id);
      const state: CampaignChapterCardState = {
        completedMissions: progress.filter((missionProgress) => missionProgress.state === "completed").length,
        totalMissions: chapter.missions.length,
        isRecommended: progress.some(
          (missionProgress) => missionProgress.mission.id === this.recommendedMission()?.mission.id
        ),
        isLocked: !progress.some((missionProgress) =>
          ["available", "inProgress", "completed"].includes(missionProgress.state)
        )
      };
      return { chapter, progress, state };
    })
  );

  protected async selectChapter(chapterId: CampaignChapterId): Promise<void> {
    await this.router.navigate(["/aota/campaign", chapterId]);
  }

  async ngOnInit(): Promise<void> {
    await this.campaignProgressService.load();
  }
}
