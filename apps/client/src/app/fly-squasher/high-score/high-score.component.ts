import { Component, OnInit } from "@angular/core";
import { HighScoreService } from "./high-score.service";
import { FlySquasherLevelEnum, FlySquasherLevels, ScoreDto } from "@fuzzy-waddle/api-interfaces";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "fly-squasher-high-score",
  templateUrl: "./high-score.component.html",
  styleUrls: ["./high-score.component.scss"]
})
export class HighScoreComponent implements OnInit {
  protected readonly faSpinner = faSpinner;
  protected loading = true;
  protected highScores: ScoreDto[] = [];

  constructor(private readonly highScoreService: HighScoreService) {}

  async ngOnInit(): Promise<void> {
    this.highScores = await this.highScoreService.getScores();
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
