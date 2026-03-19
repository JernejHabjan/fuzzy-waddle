import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { type GameScoreSnapshotDto, PlayerScoreDto } from "@fuzzy-waddle/api-interfaces";

export class SubmitScoresDto {
  @IsUUID()
  gameInstanceId!: string;

  @IsUUID()
  submittedByUserId!: string;

  @IsOptional()
  @IsString()
  gameType?: string;

  @IsOptional()
  @IsNumber()
  mapId?: number;

  @IsOptional()
  @IsNumber()
  humanPlayerCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerScoreDto)
  playerScores!: PlayerScoreDto[];

  @IsOptional()
  @IsArray()
  snapshots?: GameScoreSnapshotDto[];
}
