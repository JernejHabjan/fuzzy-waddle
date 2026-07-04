import type { PlayerScoreData } from "./score-data";
import { GameResultStatus } from "../../database/database-enums";

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
