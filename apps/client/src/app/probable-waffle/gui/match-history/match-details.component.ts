import { Component, inject, signal, input } from "@angular/core";
import type { OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { type GameSessionDetails, ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { MatchHistoryService } from "../../services/match-history.service";
import { ScoreTableComponent } from "../score-screen/table/score-table.component";
import { ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "probable-waffle-match-details",
  imports: [DatePipe, ScoreTableComponent],
  templateUrl: "./match-details.component.html",
  styleUrl: "./match-details.component.scss"
})
export class MatchDetailsComponent implements OnInit {
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly router = inject(Router);

  // Route parameter
  readonly gameInstanceId = input.required<string>();

  protected readonly gameDetails = signal<GameSessionDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadMatchDetails();
  }

  private async loadMatchDetails(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const instanceId = this.gameInstanceId();
    if (!instanceId) {
      this.error.set("No game instance ID provided");
      this.loading.set(false);
      return;
    }

    this.matchHistoryService.getMatchDetails(instanceId).subscribe({
      next: (details) => {
        this.gameDetails.set(details);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Failed to load match details:", err);
        this.error.set(
          "Failed to load match details. The match may not exist or you may not have permission to view it."
        );
        this.loading.set(false);
      }
    });
  }

  protected getMapName(mapId: ProbableWaffleMapEnum): string {
    const level = Object.values(ProbableWaffleLevels).find((l) => l.id === mapId);
    return level?.name ?? "Unknown Map";
  }

  protected formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  }

  protected handleBack(): void {
    this.router.navigate(["/aota/match-history"]);
  }
}
