import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlayerStateActionType, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

export type PlayerSummary = {
  name: string;
  unit_produced: number;
  unit_killed: number;
  building_constructed: number;
  building_destroyed: number;
  resource_collected: number;
  resource_spent: number;
};

@Component({
  selector: "probable-waffle-score-table",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./score-table.component.html",
  styleUrls: ["./score-table.component.scss"]
})
export class ScoreTableComponent implements OnInit {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected players: PlayerSummary[] = [];

  ngOnInit(): void {
    if (!this.gameInstanceClientService.gameInstance) return;
    const players = this.gameInstanceClientService.gameInstance.players;
    this.players = players.map((p) => {
      return {
        name: p.playerController.data.playerDefinition!.player.playerName!,
        unit_produced: this.getTotalForPlayer(p, "unit_produced"),
        unit_killed: this.getTotalForPlayer(p, "unit_killed"),
        building_constructed: this.getTotalForPlayer(p, "building_constructed"),
        building_destroyed: this.getTotalForPlayer(p, "building_destroyed"),
        resource_collected: this.getTotalForPlayer(p, "resource_collected"),
        resource_spent: this.getTotalForPlayer(p, "resource_spent")
      } satisfies PlayerSummary;
    });
  }

  private getTotalForPlayer(player: ProbableWafflePlayer, type: PlayerStateActionType): number {
    const summary = player.playerState.data.summary;
    return summary.filter((s) => s.type === type).length;
  }

  protected getTotal(type: PlayerStateActionType): number {
    return this.players.map((p: PlayerSummary) => p[type]).reduce((a, b) => a + b, 0);
  }
}
