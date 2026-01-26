import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { LittleMuncherHillEnum, LittleMuncherScoreDto } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";
import { firstValueFrom } from "rxjs";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { AuthService } from "../../auth/auth.service";
import { type HighScoreServiceInterface } from "./high-score.service.interface";

@Injectable({
  providedIn: "root"
})
export class HighScoreService implements HighScoreServiceInterface {
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);

  async postScore(score: number, hill: LittleMuncherHillEnum): Promise<void> {
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/little-muncher/post-score";
      const body = new LittleMuncherScoreDto(score, hill, this.authService.fullName!, this.authService.userId!);
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async getScores(): Promise<LittleMuncherScoreDto[]> {
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/little-muncher/get-scores";
      return await firstValueFrom(this.httpClient.get<LittleMuncherScoreDto[]>(url));
    }
    return [];
  }
}
