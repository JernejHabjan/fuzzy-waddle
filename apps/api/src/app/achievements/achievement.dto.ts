import { IsObject, IsOptional, IsString } from "class-validator";

export class UnlockAchievementDto {
  @IsString()
  achievementId!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
