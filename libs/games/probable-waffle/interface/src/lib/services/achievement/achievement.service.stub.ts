import { type AchievementServiceInterface } from "./achievement.service.interface";
import { type AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";
import { type AchievementDefinition } from "./achievement-definition";

export const achievementServiceStub = {
  achievements$: new Observable<AchievementDto[]>(),
  loadUserAchievements: function (): Promise<AchievementDto[]> {
    return Promise.resolve([]);
  },
  getUserAchievements: function (): Observable<AchievementDto[]> {
    return this.achievements$;
  },
  unlockAchievement: function (): Promise<boolean> {
    return Promise.resolve(true);
  },
  isAchievementUnlocked: function (): boolean {
    return false;
  },
  getAchievementDefinitions: function (): AchievementDefinition[] {
    return [];
  },
  getAchievementDefinition: function (): AchievementDefinition | null {
    return null;
  }
} satisfies AchievementServiceInterface;
