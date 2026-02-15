import { inject, Injectable } from "@angular/core";
import type { PlayerNumber, PlayerScoreData } from "@fuzzy-waddle/api-interfaces";
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
   * Get score data for a specific player
   */
  getPlayerScore(playerNumber: PlayerNumber): PlayerScoreData | undefined {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return undefined;

    const scoreData = gameInstance.gameState.data.scoreData;
    if (!scoreData) return undefined;

    return scoreData.get(playerNumber);
  }

  /**
   * Get all player scores
   */
  getAllPlayerScores(): PlayerScoreData[] {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return [];

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
    if (!gameInstance) return [];

    return gameInstance.gameState.data.scoreSnapshots || [];
  }

  /**
   * Check if score data is available
   */
  hasScoreData(): boolean {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return false;

    const scoreData = gameInstance.gameState.data.scoreData;
    return scoreData !== undefined && scoreData.size > 0;
  }
}
