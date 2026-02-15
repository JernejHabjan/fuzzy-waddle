import { IsUUID, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import type { PlayerScoreData } from "@fuzzy-waddle/api-interfaces";

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

export class SubmitScoresDto {
  @IsUUID()
  gameInstanceId!: string;

  @IsUUID()
  submittedByUserId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerScoreDto)
  playerScores!: PlayerScoreDto[];
}
