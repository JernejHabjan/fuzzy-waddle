import type { PlayerScoreData } from "./score-data";
import { GameResultStatus } from "@fuzzy-waddle/platform-database-schema";

export class PlayerScoreDto implements Partial<PlayerScoreData> {
  playerNumber!: number;
  playerName!: string;
  playerType!: string;
  teamNumber?: number;
  factionType!: string;
  gameResult!: GameResultStatus;
  eliminated!: boolean;
  eliminatedAt?: number;
  finalScore!: number;
  metrics!: Record<string, number>;
  userId?: string;
}
