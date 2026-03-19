import { Component, inject, signal } from "@angular/core";
import type { OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { type MatchHistorySummary, ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { MatchHistoryService } from "../../services/match-history.service";
import { ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";

@Component({
  selector: "probable-waffle-match-history-page",
  imports: [DatePipe, RouterLink],
  templateUrl: "./match-history-page.component.html",
  styleUrl: "./match-history-page.component.scss"
})
export class MatchHistoryPageComponent implements OnInit {
  private readonly matchHistoryService = inject(MatchHistoryService);
  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
  private readonly router = inject(Router);

  protected readonly matches = signal<MatchHistorySummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly limit = 20;
  protected readonly total = signal(0);
  protected readonly Math = Math;

  async ngOnInit(): Promise<void> {
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      await this.loadMatches();
    } else {
      this.loading.set(false);
    }
  }

  protected async loadMatches(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const offset = (this.currentPage() - 1) * this.limit;

    this.matchHistoryService.getMatchHistory(this.limit, offset).subscribe({
      next: (response) => {
        this.matches.set(response.matches);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Failed to load match history:", err);
        this.error.set("Failed to load match history. Please try again later.");
        this.loading.set(false);
      }
    });
  }

  protected getMapName(mapId: ProbableWaffleMapEnum): string {
    const level = Object.values(ProbableWaffleLevels).find((l) => l.id === Number(mapId));
    return level?.name || "Unknown Map";
  }

  protected formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  protected viewDetails(gameInstanceId: string): void {
    this.router.navigate(["/aota/match-details", gameInstanceId]);
  }

  protected async previousPage(): Promise<void> {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      await this.loadMatches();
    }
  }

  protected async nextPage(): Promise<void> {
    const maxPage = Math.ceil(this.total() / this.limit);
    if (this.currentPage() < maxPage) {
      this.currentPage.set(this.currentPage() + 1);
      await this.loadMatches();
    }
  }

  protected get hasMore(): boolean {
    return this.currentPage() * this.limit < this.total();
  }

  protected handleBack(): void {
    this.router.navigate(["/aota"]);
  }
}
