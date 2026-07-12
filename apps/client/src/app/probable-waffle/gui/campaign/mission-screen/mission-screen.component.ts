import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign-catalog";
import { CampaignProgressService } from "../campaign-progress.service";

@Component({
  selector: "fuzzy-waddle-campaign-mission-screen",
  templateUrl: "./mission-screen.component.html",
  styleUrls: ["./mission-screen.component.scss"],
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissionScreenComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaignProgressService = inject(CampaignProgressService);
  private readonly chapterId = this.route.snapshot.paramMap.get("chapterId");
  private readonly missionId = this.route.snapshot.paramMap.get("missionId");
  protected readonly chapter = AOTA_CAMPAIGN_CATALOG.chapters.find((chapter) => chapter.id === this.chapterId);
  protected readonly selectedMission = computed(
    () => this.chapter?.missions.find((mission) => mission.id === this.missionId) ?? this.chapter?.missions[0]
  );
  protected readonly missionProgress = computed(() => {
    const mission = this.selectedMission();
    return mission ? this.campaignProgressService.getMissionProgress(mission.id) : undefined;
  });

  constructor() {
    if (!this.chapter || (this.missionId && !this.selectedMission())) {
      void this.router.navigate(["/aota/campaign"], { replaceUrl: true });
    }
  }
}
