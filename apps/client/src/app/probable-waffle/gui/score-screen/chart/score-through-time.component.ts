import { Component, inject, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  GameSetupHelpers,
  PlayerStateAction,
  PlayerStateActionType,
  ProbableWafflePlayer
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { NgChartsModule } from "ng2-charts";
import { ChartConfiguration, ChartData, ChartTypeRegistry, DefaultDataPoint } from "chart.js";

@Component({
  selector: "probable-waffle-score-through-time",
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: "./score-through-time.component.html",
  styleUrls: ["./score-through-time.component.scss"]
})
export class ScoreThroughTimeComponent implements OnInit {
  @Input({ required: true }) summaryType!: "units" | "buildings" | "resources";
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
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
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        ticks: {
          callback: this.formatTimestampLabel
        }
      }
    }
  };

  protected readonly chartLegend = true;
  protected readonly chartType: "bar" | "line" | "scatter" | "bubble" | "pie" | "doughnut" | "polarArea" | "radar" =
    "line";
  private summaryAddType!: PlayerStateActionType;
  private summaryRemoveType!: PlayerStateActionType;
  protected chartTitle!: string;
  ngOnInit(): void {
    this.prepareGraphData();
  }

  private prepareGraphData() {
    if (!this.gameInstanceClientService.gameInstance) return;

    switch (this.summaryType) {
      case "units":
        this.summaryAddType = "unit_produced";
        this.summaryRemoveType = "unit_killed";
        this.chartTitle = "Units produced";
        break;
      case "buildings":
        this.summaryAddType = "building_constructed";
        this.summaryRemoveType = "building_destroyed";
        this.chartTitle = "Buildings constructed";
        break;
      case "resources":
        this.summaryAddType = "resource_collected";
        this.summaryRemoveType = "resource_spent";
        this.chartTitle = "Resources collected";
        break;
    }

    const players = this.gameInstanceClientService.gameInstance.players;
    const allTimestamps = this.getAllTimestamps(players);

    this.chartData.labels = allTimestamps.map((n) => n.toString());

    players.forEach((player) => {
      const playerName = player.playerController.data.playerDefinition!.player.playerName!;
      const buildingProduced = this.getBuildingProducedForPlayer(player, allTimestamps);

      this.chartData.datasets.push({
        label: playerName,
        data: buildingProduced,
        fill: false,
        borderColor: GameSetupHelpers.getColorForPlayer(player.playerNumber!, players.length)
      });
    });
  }

  private getBuildingProducedForPlayer(player: ProbableWafflePlayer, allTimestamps: number[]): number[] {
    const timestamps = allTimestamps;
    const buildingProduced: number[] = new Array(timestamps.length).fill(0);

    let cumulativeCount = 0;
    const summary = player.playerState.data.summary;

    timestamps.forEach((timestamp, index) => {
      const producedEvent = summary.find((s) => s.type === this.summaryAddType && s.time === timestamp);
      if (producedEvent) {
        cumulativeCount++;
      }

      const killedEvents = this.getOtherPlayers(player)
        .map((p) => p.playerState.data.summary)
        .flat()
        .filter(
          (s) =>
            s.type === this.summaryRemoveType && s.time === timestamp && s.data.killedPlayerNr === player.playerNumber
        );

      cumulativeCount -= killedEvents.length;
      buildingProduced[index] = cumulativeCount;
    });

    return buildingProduced;
  }

  getOtherPlayers(player: ProbableWafflePlayer): ProbableWafflePlayer[] {
    return this.gameInstanceClientService.gameInstance!.players.filter((p) => p.playerNumber !== player.playerNumber);
  }

  private getAllTimestamps(players: ProbableWafflePlayer[]): number[] {
    const timestamps: number[] = [];

    players.forEach((player) => {
      const summary = player.playerState.data.summary;

      summary.forEach((s: PlayerStateAction) => {
        if (!timestamps.includes(s.time)) {
          timestamps.push(s.time);
        }
      });
    });
    // Ensure that 0 is in the timestamps array
    if (!timestamps.includes(0)) {
      timestamps.unshift(0);
    }
    // Sort timestamps in ascending order
    // noinspection UnnecessaryLocalVariableJS
    const sortedTimestamps = timestamps.sort((a, b) => a - b);
    return sortedTimestamps;
  }

  private formatTimestampLabel(value: string | number): string {
    return Math.floor((value as number) / 1000).toString() + "s";
  }
}
