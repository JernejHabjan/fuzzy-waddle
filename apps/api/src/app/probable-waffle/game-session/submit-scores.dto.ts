import { IsArray, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PlayerScoreDto } from "@fuzzy-waddle/api-interfaces";

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
