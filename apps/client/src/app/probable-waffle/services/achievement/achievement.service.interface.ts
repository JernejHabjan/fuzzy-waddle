import { Observable } from "rxjs";
import { AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { AchievementType } from "./achievement-type";
import { AchievementDefinition } from "./achievement-definition";

export interface AchievementServiceInterface {
  achievements$: Observable<AchievementDto[]>;
  loadUserAchievements(userId?: string): Promise<AchievementDto[]>;
  getUserAchievements(): Observable<AchievementDto[]>;
  unlockAchievement(achievementId: AchievementType, showNotification: boolean, metadata?: any): Promise<boolean>;
  isAchievementUnlocked(achievementId: AchievementType): boolean;
  getAchievementDefinitions(): AchievementDefinition[];
  getAchievementDefinition(achievementId: AchievementType): AchievementDefinition | null;
}
