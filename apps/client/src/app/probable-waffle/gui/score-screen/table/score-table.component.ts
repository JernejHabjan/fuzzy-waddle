import type { OnInit } from "@angular/core";
import { Component, inject, input } from "@angular/core";
import { type PlayerScoreData, STANDARD_METRICS } from "@fuzzy-waddle/api-interfaces";
import { ScoreDataService } from "../../../services/score-data.service";

@Component({
  selector: "probable-waffle-score-table",
  templateUrl: "./score-table.component.html",
  styleUrls: ["./score-table.component.scss"]
})
export class ScoreTableComponent implements OnInit {
  private readonly scoreDataService = inject(ScoreDataService);

  // Accept playerScores as input for reusability (e.g., from match history)
  readonly playerScores = input<PlayerScoreData[]>();

  protected players: PlayerScoreData[] = [];
  protected readonly METRICS = STANDARD_METRICS;

  ngOnInit(): void {
    // Use provided playerScores or fetch from service
    const providedScores = this.playerScores();
    if (providedScores && providedScores.length > 0) {
      this.players = [...providedScores].sort((a, b) => b.finalScore - a.finalScore);
    } else {
      this.players = this.scoreDataService.getSortedPlayersByScore();
    }
  }

  protected getMetric(player: PlayerScoreData, metricKey: string): number {
    return player.metrics[metricKey] || 0;
  }
}
