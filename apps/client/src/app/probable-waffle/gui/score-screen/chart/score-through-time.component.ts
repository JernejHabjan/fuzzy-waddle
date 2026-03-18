import { Component, inject, type OnInit } from "@angular/core";

import { type GameScoreSnapshot, type PlayerNumber } from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { ScoreDataService } from "../../../services/score-data.service";
import { GameSetupHelpers } from "@fuzzy-waddle/api-interfaces";
import { type ChartConfiguration, type ChartData, type ChartTypeRegistry, type DefaultDataPoint } from "chart.js";
import { BaseChartDirective } from "ng2-charts";

type SnapshotMetric = "units" | "buildings" | "resources" | "armyValue";

interface MetricOption {
  value: SnapshotMetric;
  label: string;
}

@Component({
  selector: "probable-waffle-score-through-time",
  imports: [BaseChartDirective],
  templateUrl: "./score-through-time.component.html",
  styleUrls: ["./score-through-time.component.scss"]
})
export class ScoreThroughTimeComponent implements OnInit {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly scoreDataService = inject(ScoreDataService);

  protected ready = false;

  protected readonly metricOptions: MetricOption[] = [
    { value: "units", label: "Unit Count" },
    { value: "buildings", label: "Building Count" },
    { value: "resources", label: "Total Resources" },
    { value: "armyValue", label: "Army Value" }
  ];

  protected selectedMetric: SnapshotMetric = "units";

  protected readonly chartData: ChartData<"line", Array<number | DefaultDataPoint<keyof ChartTypeRegistry>>, string> = {
    datasets: [],
    labels: []
  };

  protected readonly chartOptions: ChartConfiguration<
    "bar" | "line" | "scatter" | "bubble" | "pie" | "doughnut" | "polarArea" | "radar",
    Array<number | DefaultDataPoint<keyof ChartTypeRegistry>>,
    string
  >["options"] = {
    responsive: true,
    plugins: {
      legend: { position: "top" }
    }
  };

  protected readonly chartLegend = true;
  protected readonly chartType: "line" = "line";

  ngOnInit(): void {
    this.buildChart();
  }

  protected onMetricChange(event: Event): void {
    this.selectedMetric = (event.target as HTMLSelectElement).value as SnapshotMetric;
    this.buildChart();
  }

  private buildChart(): void {
    const snapshots = this.scoreDataService.getScoreSnapshots();

    if (snapshots.length > 0) {
      this.buildFromSnapshots(snapshots);
    } else {
      this.ready = false;
    }
  }

  private buildFromSnapshots(snapshots: GameScoreSnapshot[]): void {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    const gameInstanceId = gameInstance?.gameInstanceMetadata?.data?.gameInstanceId;
    const players = gameInstance?.players ?? [];

    const playerNumbers: PlayerNumber[] = [];
    snapshots.forEach((s) => {
      s.playerScores.forEach((_, num) => {
        if (!playerNumbers.includes(num)) playerNumbers.push(num);
      });
    });

    const startTime = snapshots[0]?.timestamp ?? 0;
    const labels = snapshots.map((s) => `${Math.floor((s.timestamp - startTime) / 1000)}s`);
    const datasets = playerNumbers.map((playerNumber) => {
      const player = players.find((p) => p.playerNumber === playerNumber);
      const label =
        player?.playerController?.data?.playerDefinition?.player?.playerName ?? `Player ${playerNumber}`;
      const color = GameSetupHelpers.getStringColorForPlayer(playerNumber, players.length, gameInstanceId);

      const data = snapshots.map((snapshot) => {
        const ps = snapshot.playerScores.get(playerNumber);
        if (!ps) return 0;
        switch (this.selectedMetric) {
          case "units":
            return ps.unitsCount;
          case "buildings":
            return ps.buildingsCount;
          case "resources":
            return ps.totalResources;
          case "armyValue":
            return ps.armyValue;
        }
      });

      return { label, data, fill: false, borderColor: color, tension: 0.1 };
    });

    this.chartData.labels = labels;
    this.chartData.datasets = datasets;
    this.ready = true;
  }
}
