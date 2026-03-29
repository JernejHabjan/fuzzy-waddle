import { Component, inject, input, type OnInit } from "@angular/core";

import {
  type GameScoreSnapshot,
  type GameScoreSnapshotDto,
  GameSetupHelpers,
  type PlayerNumber
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { ScoreDataService } from "../../../services/score-data.service";
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

  // Optional external data for match history view
  readonly externalSnapshots = input<GameScoreSnapshotDto[] | undefined>();
  readonly externalPlayers = input<Array<{ playerNumber: number; playerName: string }> | undefined>();
  readonly externalGameInstanceId = input<string | undefined>();

  protected ready = false;

  protected readonly metricOptions: MetricOption[] = [
    { value: "units", label: "Unit Count" },
    { value: "buildings", label: "Building Count" },
    { value: "resources", label: "Total Resources" },
    { value: "armyValue", label: "Army Value" }
  ];

  protected selectedMetric: SnapshotMetric = "units";

  // Reassigned on each build so ng2-charts detects the change
  protected chartData: ChartData<"line", Array<number | DefaultDataPoint<keyof ChartTypeRegistry>>, string> = {
    datasets: [],
    labels: []
  };

  protected readonly chartOptions: ChartConfiguration<
    "bar" | "line" | "scatter" | "bubble" | "pie" | "doughnut" | "polarArea" | "radar",
    Array<number | DefaultDataPoint<keyof ChartTypeRegistry>>,
    string
  >["options"] = {
    responsive: true,
    animation: false, // prevents crash when legend is clicked after chart destroys
    plugins: {
      legend: { position: "top" }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  protected readonly chartLegend = true;
  protected readonly chartType = "line" as const;

  ngOnInit(): void {
    this.buildChart();
  }

  protected onMetricChange(event: Event): void {
    this.selectedMetric = (event.target as HTMLSelectElement).value as SnapshotMetric;
    this.buildChart();
  }

  private buildChart(): void {
    const external = this.externalSnapshots();
    if (external && external.length > 0) {
      this.buildFromSnapshotDtos(external);
      return;
    }

    const snapshots = this.scoreDataService.getScoreSnapshots();
    if (snapshots.length > 0) {
      this.buildFromSnapshots(snapshots);
    } else {
      this.ready = false;
    }
  }

  private buildFromSnapshotDtos(snapshots: GameScoreSnapshotDto[]): void {
    const players = this.externalPlayers() ?? [];
    const gameInstanceId = this.externalGameInstanceId();
    const totalPlayers = players.length || snapshots[0]?.playerScores?.length || 1;

    const playerNumbers = Array.from(
      new Set(snapshots.flatMap((s) => s.playerScores.map((ps) => ps.playerNumber)))
    ).sort((a, b) => a - b);

    const startTime = snapshots[0]?.timestamp ?? 0;
    const labels = snapshots.map((s) => `${Math.floor((s.timestamp - startTime) / 1000)}s`);

    const datasets = playerNumbers.map((playerNumber) => {
      const playerInfo = players.find((p) => p.playerNumber === playerNumber);
      const label = playerInfo?.playerName ?? `Player ${playerNumber}`;
      const color = GameSetupHelpers.getStringColorForPlayer(playerNumber, totalPlayers, gameInstanceId);

      const data = snapshots.map((snapshot) => {
        const ps = snapshot.playerScores.find((p) => p.playerNumber === playerNumber);
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

      return { label, data, fill: false, borderColor: color, backgroundColor: color, tension: 0.1 };
    });

    this.chartData = { labels, datasets };
    this.ready = true;
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
      const label = player?.playerController?.data?.playerDefinition?.player?.playerName ?? `Player ${playerNumber}`;
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

      return { label, data, fill: false, borderColor: color, backgroundColor: color, tension: 0.1 };
    });

    // Assign a new object so ng2-charts detects the reference change and redraws
    this.chartData = { labels, datasets };
    this.ready = true;
  }
}
