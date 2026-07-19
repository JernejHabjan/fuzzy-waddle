import { Observable } from "rxjs";
import type { AchievementDto } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UserId } from "@fuzzy-waddle/platform-game-sessions";
import { AchievementType } from "./achievement-type";
import { type AchievementDefinition } from "./achievement-definition";

export interface AchievementServiceInterface {
  achievements$: Observable<AchievementDto[]>;
  loadUserAchievements(userId?: UserId): Promise<AchievementDto[]>;
  getUserAchievements(): Observable<AchievementDto[]>;
  unlockAchievement(achievementId: AchievementType, showNotification: boolean, metadata?: any): Promise<boolean>;
  isAchievementUnlocked(achievementId: AchievementType): boolean;
  getAchievementDefinitions(): AchievementDefinition[];
  getAchievementDefinition(achievementId: AchievementType): AchievementDefinition | null;
}
