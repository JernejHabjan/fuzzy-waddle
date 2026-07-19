import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import {
  CAMPAIGN_MISSION_IDS,
  type CampaignMissionId,
  CampaignMissionOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";

export class StartCampaignRunDto {
  @IsUUID() runId!: string;
  @IsIn([...CAMPAIGN_MISSION_IDS]) missionId!: CampaignMissionId;
}

export class CampaignResultDto {
  @IsUUID() runId!: string;
  @IsIn([...CAMPAIGN_MISSION_IDS]) missionId!: CampaignMissionId;
  @IsIn(Object.values(CampaignMissionOutcome)) outcome!: CampaignMissionOutcome;
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) completedObjectiveIds?: string[];
}

export class MergeCampaignProgressDto {
  @IsArray()
  completedMissions!: Array<{ missionId: CampaignMissionId; completedAt: string }>;
}
