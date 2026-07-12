import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import {
  CAMPAIGN_CHAPTER_IDS,
  CAMPAIGN_MISSION_IDS,
  type CampaignChapterId,
  type CampaignMissionId,
  GameSaveKind,
  GameSaveScope
} from "@fuzzy-waddle/api-interfaces";

export class SyncGameSaveDto {
  @IsUUID() id!: string;
  @IsIn(Object.values(GameSaveScope)) scope!: GameSaveScope;
  @IsIn(Object.values(GameSaveKind)) kind!: GameSaveKind;
  @IsOptional() @IsString() name?: string;
  @IsOptional()
  @IsIn([...CAMPAIGN_CHAPTER_IDS])
  campaignChapterId?: CampaignChapterId;
  @IsOptional() @IsIn([...CAMPAIGN_MISSION_IDS]) campaignMissionId?: CampaignMissionId;
  @IsOptional() @IsString() campaignRunId?: string;
  @IsInt() @Min(1) revision!: number;
  @IsInt() @Min(1) formatVersion!: number;
  @IsBoolean() isDeleted!: boolean;
  @IsOptional() @IsString() thumbnail?: string;
  @IsString() encodedGameInstanceData!: string;
}
