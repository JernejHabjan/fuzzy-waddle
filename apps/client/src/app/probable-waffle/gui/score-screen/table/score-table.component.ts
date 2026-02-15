import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { type PlayerScoreData, STANDARD_METRICS } from "@fuzzy-waddle/api-interfaces";
import { ScoreDataService } from "../../../services/score-data.service";

@Component({
  selector: "probable-waffle-score-table",
  templateUrl: "./score-table.component.html",
  styleUrls: ["./score-table.component.scss"]
})
export class ScoreTableComponent implements OnInit {
  private readonly scoreDataService = inject(ScoreDataService);
  protected players: PlayerScoreData[] = [];
  protected readonly METRICS = STANDARD_METRICS;

  ngOnInit(): void {
    this.players = this.scoreDataService.getSortedPlayersByScore();
  }

  protected getMetric(player: PlayerScoreData, metricKey: string): number {
    return player.metrics[metricKey] || 0;
  }
}
