import type { GameScoreSnapshotDto, PlayerScoreData } from "./score-data";
import { ProbableWaffleMapEnum } from "../../probable-waffle/probable-waffle";
import { GameResultStatus } from "../../database/database-enums";

/**
 * Player summary in match history
 */
export interface MatchHistoryPlayer {
  playerNumber: number;
  playerName: string;
  factionType: string;
  gameResult: GameResultStatus;
  finalScore: number;
  isCurrentUser: boolean;
}

/**
 * Match history summary for list view
 */
export interface MatchHistorySummary {
  id: string;
  gameInstanceId: string;
  gameType: string;
  mapId: ProbableWaffleMapEnum;
  startedAt: string;
  endedAt: string;
  totalDurationSeconds: number;
  humanPlayerCount: number;
  userResult: GameResultStatus;
  players: MatchHistoryPlayer[];
}

/**
 * Match history response with pagination
 */
export interface MatchHistoryResponse {
  matches: MatchHistorySummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Game session details for match details view
 */
export interface GameSessionDetails {
  gameSession: {
    id: string;
    gameInstanceId: string;
    gameType: string;
    mapId: ProbableWaffleMapEnum;
    startedAt: string;
    endedAt: string;
    totalDurationSeconds: number;
    humanPlayerCount: number;
  };
  playerScores: PlayerScoreData[];
  snapshots: GameScoreSnapshotDto[];
}
