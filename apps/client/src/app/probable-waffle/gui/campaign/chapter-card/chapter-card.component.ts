import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import type { CampaignChapterDefinition, CampaignMissionProgress } from "@fuzzy-waddle/api-interfaces";

export interface CampaignChapterCardState {
  completedMissions: number;
  totalMissions: number;
  isRecommended: boolean;
  isSelected: boolean;
}

@Component({
  selector: "fuzzy-waddle-campaign-chapter-card",
  templateUrl: "./chapter-card.component.html",
  styleUrls: ["./chapter-card.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChapterCardComponent {
  readonly chapter = input.required<CampaignChapterDefinition>();
  readonly missionProgress = input.required<CampaignMissionProgress[]>();
  readonly state = input.required<CampaignChapterCardState>();
  readonly chapterSelected = output<string>();

  selectChapter(): void {
    this.chapterSelected.emit(this.chapter().id);
  }
}
