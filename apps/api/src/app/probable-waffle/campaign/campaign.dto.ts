import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class StartCampaignRunDto {
  @IsUUID() runId!: string;
  @IsString() missionId!: string;
}

export class CampaignResultDto {
  @IsUUID() runId!: string;
  @IsString() missionId!: string;
  @IsIn(["victory", "defeat", "abandoned"]) outcome!: "victory" | "defeat" | "abandoned";
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) completedObjectiveIds?: string[];
}

export class MergeCampaignProgressDto {
  @IsArray()
  completedMissions!: Array<{ missionId: string; completedAt: string }>;
}
