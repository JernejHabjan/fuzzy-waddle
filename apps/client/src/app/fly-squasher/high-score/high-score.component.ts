import { Component, inject, OnInit } from "@angular/core";
import { HighScoreService } from "./high-score.service";
import { FlySquasherLevelEnum, FlySquasherLevels, ScoreDto } from "@fuzzy-waddle/api-interfaces";
import { faExclamationTriangle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { ServerHealthService } from "../../shared/services/server-health.service";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";

@Component({
  selector: "fly-squasher-high-score",
  templateUrl: "./high-score.component.html",
  standalone: true,
  imports: [FaIconComponent, RouterLink],
  host: AngularHost.contentFlexFullHeightCenter
})
export class HighScoreComponent implements OnInit {
  protected readonly faSpinner = faSpinner;
  protected readonly faExclamationTriangle = faExclamationTriangle;
  protected loading = true;
  protected highScores: ScoreDto[] = [];

  private readonly highScoreService = inject(HighScoreService);
  protected readonly serverHealthService = inject(ServerHealthService);

  async ngOnInit(): Promise<void> {
    await this.serverHealthService.checkHealth();
    if (this.serverHealthService.serverAvailable) {
      this.highScores = await this.highScoreService.getScores();
    }
    this.loading = false;
  }

  protected getUniqueLevels(highScores: ScoreDto[]) {
    const uniqueLevels = [...new Set(highScores.map((score) => score.level))];
    return uniqueLevels.map((level) => FlySquasherLevels[level]);
  }

  protected getTopScoresForLevel(highScores: ScoreDto[], level: FlySquasherLevelEnum) {
    return highScores.filter((score) => score.level === level).sort((a, b) => b.score - a.score);
  }
}
