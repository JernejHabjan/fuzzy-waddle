import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import {
  type GameScoreSnapshotDto,
  type PlayerScoreData,
  type ProbableWaffleGameInstance,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class ScoreSubmissionService {
  private readonly http = inject(HttpClient);

  /**
   * Check if current user is the last human player to exit
   * Only the last player should submit scores to avoid duplicates
   */
  isLastHumanPlayer(gameInstance: ProbableWaffleGameInstance, currentUserId: string): boolean {
    // Get all human players
    const humanPlayers = gameInstance.players.filter(
      (p) => p.playerController.data.playerDefinition?.playerType !== ProbableWafflePlayerType.AI
    );

    if (humanPlayers.length === 0) return false;

    // Get other human players (exclude current user)
    const otherHumans = humanPlayers.filter((p) => p.playerController.data.userId !== currentUserId);

    // If no other humans, current user is last
    if (otherHumans.length === 0) return true;

    // Check if all other humans have left or been killed
    return otherHumans.every((p) => p.playerController.data.leftOrKilled === true);
  }

  /**
   * Submit scores for all players in a game
   * Idempotent - safe to call multiple times
   */
  submitScores(
    gameInstanceId: string,
    playerScores: PlayerScoreData[],
    submittedByUserId: string,
    sessionMeta?: { gameType?: string; mapId?: number; humanPlayerCount?: number },
    snapshots?: GameScoreSnapshotDto[]
  ): Observable<{ success: boolean; message: string }> {
    const url = environment.api + "api/probable-waffle/game-session/submit-scores";

    const payload = {
      gameInstanceId,
      playerScores,
      submittedByUserId,
      ...sessionMeta,
      snapshots
    };

    return this.http.post<{ success: boolean; message: string }>(url, payload).pipe(
      map((response) => {
        console.log("Scores submitted successfully:", response.message);
        return response;
      }),
      catchError((error) => {
        console.error("Failed to submit scores:", error);
        // Return success anyway - score submission is not critical
        return of({ success: false, message: "Failed to submit scores" });
      })
    );
  }

  /**
   * Get all player scores from game instance
   */
  getAllPlayerScores(gameInstance: ProbableWaffleGameInstance): PlayerScoreData[] {
    if (!gameInstance.gameState) return [];

    const scoreData = gameInstance.gameState.data.scoreData;
    if (!scoreData) return [];

    return Array.from(scoreData.values());
  }
}
