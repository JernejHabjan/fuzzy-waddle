import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from "class-validator";
import {
  CAMPAIGN_CHAPTER_IDS,
  CAMPAIGN_MISSION_IDS,
  type CampaignChapterId,
  type CampaignMissionId,
  type CampaignParticipantProgressionSnapshot,
  GameSaveKind,
  GameSaveScope
} from "@fuzzy-waddle/probable-waffle-protocol";

export class SyncGameSaveDto {
  @IsUUID() id!: string;
  @IsIn(Object.values(GameSaveScope)) scope!: GameSaveScope;
  @IsIn(Object.values(GameSaveKind)) kind!: GameSaveKind;
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(80) campaignId?: string;
  @IsOptional()
  @IsIn([...CAMPAIGN_CHAPTER_IDS])
  campaignChapterId?: CampaignChapterId;
  @IsOptional() @IsIn([...CAMPAIGN_MISSION_IDS]) campaignMissionId?: CampaignMissionId;
  @IsOptional() @IsUUID() campaignRunId?: string;
  @IsOptional() @IsInt() @Min(1) campaignMissionRevision?: number;
  @IsOptional() @IsInt() @Min(1) campaignRuntimeSchemaVersion?: number;
  @IsOptional() @IsInt() @Min(0) campaignProfileRevision?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) campaignLoadoutIds?: string[];
  @IsOptional() @IsString() @MaxLength(120) campaignLoadoutSnapshotHash?: string;
  @IsOptional() @IsString() @MaxLength(120) campaignCheckpointId?: string;
  @IsOptional() @IsInt() @Min(1) campaignParticipantCount?: number;
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  campaignParticipantProgressionSnapshots?: CampaignParticipantProgressionSnapshot[];
  @IsInt() @Min(1) revision!: number;
  @IsInt() @Min(1) formatVersion!: number;
  @IsBoolean() isDeleted!: boolean;
  @IsOptional() @IsString() @MaxLength(1_500_000) thumbnail?: string;
  @IsString() @MaxLength(10_000_000) encodedGameInstanceData!: string;
}
