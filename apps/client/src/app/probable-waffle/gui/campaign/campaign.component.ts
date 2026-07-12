import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";

import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { ChapterCardComponent, type CampaignChapterCardState } from "./chapter-card/chapter-card.component";
import { CampaignProgressService } from "./campaign-progress.service";

@Component({
  selector: "fuzzy-waddle-campaign",
  templateUrl: "./campaign.component.html",
  styleUrls: ["./campaign.component.scss"],
  imports: [HomeNavComponent, ChapterCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignComponent {
  private readonly campaignProgressService = inject(CampaignProgressService);
  protected readonly catalog = AOTA_CAMPAIGN_CATALOG;
  protected readonly selectedChapterId = signal(AOTA_CAMPAIGN_CATALOG.chapters[0].id);
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
        isSelected: chapter.id === this.selectedChapterId()
      };
      return { chapter, progress, state };
    })
  );

  protected selectChapter(chapterId: string): void {
    this.selectedChapterId.set(chapterId);
  }
}
