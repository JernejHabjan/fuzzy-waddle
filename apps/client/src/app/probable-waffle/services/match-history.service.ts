import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import type { GameSessionDetails, MatchHistoryResponse } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";

/**
 * Service for fetching match history data from the API
 */
@Injectable({
  providedIn: "root"
})
export class MatchHistoryService {
  private readonly http = inject(HttpClient);

  /**
   * Get paginated match history for the current user
   */
  getMatchHistory(limit: number = 20, offset: number = 0): Observable<MatchHistoryResponse> {
    const url = `${environment.api}api/probable-waffle/game-session/match-history`;
    return this.http.get<MatchHistoryResponse>(url, {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
  }

  /**
   * Get detailed information for a specific match
   */
  getMatchDetails(gameInstanceId: string): Observable<GameSessionDetails> {
    const url = `${environment.api}api/probable-waffle/game-session/${gameInstanceId}/details`;
    return this.http.get<GameSessionDetails>(url);
  }
}
