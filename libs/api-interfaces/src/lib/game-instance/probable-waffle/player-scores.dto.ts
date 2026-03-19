import type { PlayerScoreData } from "./score-data";

export class PlayerScoreDto implements Partial<PlayerScoreData> {
  playerNumber!: number;
  playerName!: string;
  playerType!: string;
  teamNumber?: number;
  factionType!: string;
  gameResult!: "win" | "loss" | "tie" | "quit";
  eliminated!: boolean;
  eliminatedAt?: number;
  finalScore!: number;
  metrics!: Record<string, number>;
  userId?: string;
}
