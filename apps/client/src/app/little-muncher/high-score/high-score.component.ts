import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { HighScoreService } from "./high-score.service";
import { LittleMuncherHillEnum, LittleMuncherHills, LittleMuncherScoreDto } from "@fuzzy-waddle/api-interfaces";
import { faExclamationTriangle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { ServerHealthService } from "../../shared/services/server-health.service";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";
import { CenterWrapperComponent } from "../../shared/components/center-wrapper/center-wrapper.component";

@Component({
  selector: "little-muncher-high-score",
  templateUrl: "./high-score.component.html",
  imports: [FaIconComponent, RouterLink, HomeNavComponent, CenterWrapperComponent],
  host: AngularHost.contentFlexFullHeight
})
export class HighScoreComponent implements OnInit {
  protected readonly faSpinner = faSpinner;
  protected readonly faExclamationTriangle = faExclamationTriangle;
  protected loading = true;
  protected highScores: LittleMuncherScoreDto[] = [];

  private readonly highScoreService = inject(HighScoreService);
  protected readonly serverHealthService = inject(ServerHealthService);

  async ngOnInit(): Promise<void> {
    await this.serverHealthService.checkHealth();
    if (this.serverHealthService.serverAvailable) {
      this.highScores = await this.highScoreService.getScores();
    }
    this.loading = false;
  }

  protected getUniqueHills(highScores: LittleMuncherScoreDto[]) {
    const uniqueHills = [...new Set(highScores.map((score) => score.hill))];
    return uniqueHills.map((hill) => ({
      enum: hill,
      data: LittleMuncherHills[hill]
    }));
  }

  protected getTopScoresForHill(highScores: LittleMuncherScoreDto[], hill: LittleMuncherHillEnum) {
    return highScores.filter((score) => score.hill === hill).sort((a, b) => b.score - a.score);
  }
}
