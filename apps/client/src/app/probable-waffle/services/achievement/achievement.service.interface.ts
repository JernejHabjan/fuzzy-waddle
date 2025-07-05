import { Observable } from "rxjs";
import { AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { AchievementDefinition, AchievementType } from "./achievement.service";

export interface AchievementServiceInterface {
  loadUserAchievements(userId?: string): Promise<AchievementDto[]>;
  getUserAchievements(): Observable<AchievementDto[]>;
  unlockAchievement(achievementId: AchievementType, showNotification: boolean, metadata?: any): Promise<boolean>;
  isAchievementUnlocked(achievementId: AchievementType): boolean;
  getAchievementDefinitions(): AchievementDefinition[];
  getAchievementDefinition(achievementId: AchievementType): AchievementDefinition | null;
}
