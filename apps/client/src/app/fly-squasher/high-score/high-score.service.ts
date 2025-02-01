import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FlySquasherLevelEnum, ScoreDto } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";
import { firstValueFrom } from "rxjs";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { AuthService } from "../../auth/auth.service";

@Injectable({
  providedIn: "root"
})
export class HighScoreService {
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);

  async postScore(score: number, level: FlySquasherLevelEnum): Promise<void> {
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/fly-squasher/post-score";
      const body = new ScoreDto(score, level, this.authService.fullName!, this.authService.userId!);
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async getScores(): Promise<ScoreDto[]> {
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/fly-squasher/get-scores";
      return await firstValueFrom(this.httpClient.get<ScoreDto[]>(url));
    }
    return [];
  }
}
