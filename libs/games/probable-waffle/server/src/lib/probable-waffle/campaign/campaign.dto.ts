import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from "class-validator";
import {
  CAMPAIGN_MISSION_IDS,
  type CampaignDifficulty,
  type CampaignProfile,
  type CampaignMissionId,
  CampaignMissionOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";

export class StartCampaignRunDto {
  @IsUUID() runId!: string;
  @IsIn([...CAMPAIGN_MISSION_IDS]) missionId!: CampaignMissionId;
  @IsInt() @Min(1) missionRevision!: number;
  @IsIn(["story", "normal", "hard"]) difficulty!: CampaignDifficulty;
  @IsInt() @Min(0) baseProfileRevision!: number;
  @IsArray() @IsString({ each: true }) selectedLoadoutIds!: string[];
  @IsString() loadoutSnapshotHash!: string;
  @IsBoolean() developerOverride!: boolean;
}

export class CampaignResultDto {
  @IsUUID() runId!: string;
  @IsIn([...CAMPAIGN_MISSION_IDS]) missionId!: CampaignMissionId;
  @IsIn(Object.values(CampaignMissionOutcome)) outcome!: CampaignMissionOutcome;
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
  @IsInt() @Min(1) missionRevision!: number;
  @IsInt() @Min(0) baseProfileRevision!: number;
  @IsArray() @IsString({ each: true }) completedObjectiveIds!: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) seenCinematicIds?: string[];
  @IsArray() @IsString({ each: true }) discoveredRewardIds!: string[];
  @IsIn(["story", "normal", "hard"]) difficulty!: CampaignDifficulty;
  @IsBoolean() replayPlayback!: boolean;
  @IsObject() integrity!: { eligibleForRewards: boolean; invalidationReasons: string[] };
}

export class MergeCampaignProgressDto {
  @IsObject() profile!: CampaignProfile;
  @IsArray()
  completedMissions!: Array<{ missionId: CampaignMissionId; completedAt: string }>;
}

export class UpdateCampaignProfileDto {
  @IsInt() @Min(0) baseProfileRevision!: number;
  @IsObject() profile!: CampaignProfile;
}
