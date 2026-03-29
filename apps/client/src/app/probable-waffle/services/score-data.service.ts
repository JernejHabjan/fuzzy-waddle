import { inject, Injectable } from "@angular/core";
import type { PlayerScoreData } from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../communicators/game-instance-client.service";

/**
 * Service for accessing player score data in the client
 */
@Injectable({
  providedIn: "root"
})
export class ScoreDataService {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  /**
   * Get all player scores
   */
  getAllPlayerScores(): PlayerScoreData[] {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance?.gameState) return [];

    const scoreData = gameInstance.gameState.data.scoreData;
    if (!scoreData) return [];

    return Array.from(scoreData.values());
  }

  /**
   * Get players sorted by final score (descending)
   */
  getSortedPlayersByScore(): PlayerScoreData[] {
    return this.getAllPlayerScores().sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Get score snapshots for timeline charts
   */
  getScoreSnapshots() {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance?.gameState) return [];

    return gameInstance.gameState.data.scoreSnapshots || [];
  }

}
