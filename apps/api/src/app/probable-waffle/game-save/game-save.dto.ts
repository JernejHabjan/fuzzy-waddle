import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class SyncGameSaveDto {
  @IsUUID() id!: string;
  @IsIn(["campaign", "skirmish"]) scope!: "campaign" | "skirmish";
  @IsIn(["manual", "autosave"]) kind!: "manual" | "autosave";
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() campaignChapterId?: string;
  @IsOptional() @IsString() campaignMissionId?: string;
  @IsOptional() @IsString() campaignRunId?: string;
  @IsInt() @Min(1) revision!: number;
  @IsBoolean() isDeleted!: boolean;
  @IsOptional() @IsString() thumbnail?: string;
  @IsObject() gameInstanceData!: object;
}
