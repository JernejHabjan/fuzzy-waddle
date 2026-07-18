import type { AchievementType } from "@fuzzy-waddle/probable-waffle-protocol";

export abstract class AchievementPort {
  abstract unlockAchievement(
    achievementId: AchievementType,
    showNotification?: boolean,
    metadata?: unknown
  ): Promise<boolean>;
}
