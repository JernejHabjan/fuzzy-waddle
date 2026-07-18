import type { AchievementType } from "../achievement-type";

export abstract class AchievementPort {
  abstract unlockAchievement(
    achievementId: AchievementType,
    showNotification?: boolean,
    metadata?: unknown
  ): Promise<boolean>;
}
