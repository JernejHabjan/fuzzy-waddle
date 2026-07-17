import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import type { CampaignChapterDefinition, CampaignChapterId, CampaignMissionProgress } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignChapterCardState } from "./campaign-chapter-card-state";

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
  readonly chapterSelected = output<CampaignChapterId>();

  /** Locked cards remain visible for roadmap context but cannot be entered. */
  selectChapter(): void {
    if (this.state().isLocked) return;
    this.chapterSelected.emit(this.chapter().id);
  }
}
