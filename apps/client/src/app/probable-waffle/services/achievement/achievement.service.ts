import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { firstValueFrom } from "rxjs";
import { AchievementNotificationService } from "../achievement-notification.service";
import { AudioAtlasService } from "../audio-atlas/audio-atlas.service";
import { AuthService } from "../../../auth/auth.service";
import type { AchievementDto, UserId } from "@fuzzy-waddle/api-interfaces";
import { type AchievementServiceInterface } from "./achievement.service.interface";
import { PROBABLE_WAFFLE_ACHIEVEMENTS } from "./PROBABLE_WAFFLE_ACHIEVEMENTS";
import type { AchievementDefinition } from "./achievement-definition";
import { AchievementType } from "./achievement-type";
import { environment } from "../../../../environments/environment";

interface AchievementRecord {
  id: number;
  achievement_id: string;
  user_id: string;
  unlocked_at: string;
  metadata: any;
}

@Injectable({
  providedIn: "root"
})
export class AchievementService implements AchievementServiceInterface {
  private readonly notificationService = inject(AchievementNotificationService);
  private readonly audioAtlasService = inject(AudioAtlasService);
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);

  private achievements = new BehaviorSubject<AchievementDto[]>([]);
  private achievementsLoaded = false;

  /**
   * Observable of user achievements
   */
  public achievements$ = this.achievements.asObservable();

  /**
   * Get all achievements for the current user
   */
  async loadUserAchievements(userId?: UserId): Promise<AchievementDto[]> {
    await this.ensureAuthReady();

    // If no userId is provided, use the current user's ID
    const targetUserId = userId || this.authService.userId;

    if (!targetUserId) {
      console.warn("Cannot load achievements: No user ID provided and no user is logged in");
      return [];
    }

    try {
      const url = `${environment.api}api/achievements/unlocks`;
      const params = new HttpParams().set("userId", targetUserId);
      const unlockedData = await firstValueFrom(this.httpClient.get<AchievementRecord[]>(url, { params }));

      const unlockedRecords = unlockedData as AchievementRecord[];
      const unlockedMap = new Map<string, AchievementRecord>();

      // Create a map of unlocked achievements for quick lookup
      unlockedRecords.forEach((record) => {
        unlockedMap.set(record.achievement_id, record);
      });

      // Convert all achievement definitions to DTOs, marking which ones are unlocked
      const achievementList = Object.values(PROBABLE_WAFFLE_ACHIEVEMENTS).map((achievement) => {
        const unlockedRecord = unlockedMap.get(achievement.id);
        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          image: achievement.image,
          unlocked: !!unlockedRecord,
          unlockedDate: unlockedRecord ? new Date(unlockedRecord.unlocked_at) : undefined,
          metadata: unlockedRecord?.metadata,
          // Add additional properties from the definition
          category: achievement.category,
          difficulty: achievement.difficulty,
          // Don't show secret achievements unless they're unlocked
          secret: achievement.secret && !unlockedRecord
        };
      });

      // If this is the current user, update the subject
      this.achievements.next(achievementList);
      this.achievementsLoaded = true;

      return achievementList;
    } catch (error) {
      console.error("Error loading achievements:", error);
      return [];
    }
  }

  /**
   * Get all achievements for the current user (as an Observable)
   */
  getUserAchievements(): Observable<AchievementDto[]> {
    if (!this.achievementsLoaded) {
      this.loadUserAchievements();
    }
    return this.achievements$;
  }

  /**
   * Unlock an achievement for the user and show a notification
   */
  async unlockAchievement(achievementId: AchievementType, showNotification = true, metadata?: any): Promise<boolean> {
    try {
      await this.ensureAuthReady();

      // Make sure we're authenticated
      if (!this.authService.isAuthenticated) {
        console.warn("Cannot unlock achievement: Not authenticated");
        return false;
      }

      const userId = this.authService.userId;
      if (!userId) {
        console.warn("Cannot unlock achievement: No user ID available");
        return false;
      }

      // Check if achievement exists
      const achievementDef = PROBABLE_WAFFLE_ACHIEVEMENTS[achievementId];
      if (!achievementDef) {
        console.warn(`Achievement with ID ${achievementId} does not exist`);
        return false;
      }

      // Ensure achievements are loaded before checking if already unlocked
      if (!this.achievementsLoaded) {
        await this.loadUserAchievements();
      }

      // Check if already unlocked
      if (this.isAchievementUnlocked(achievementId)) {
        // Achievement already unlocked, no need to continue
        return false;
      }

      await firstValueFrom(
        this.httpClient.post<void>(`${environment.api}api/achievements/unlock`, {
          achievementId,
          metadata: metadata || {}
        })
      );

      // Reload achievements
      await this.loadUserAchievements();

      if (showNotification) {
        // Show a notification for the unlocked achievement
        this.notificationService.showAchievementNotification({
          title: achievementDef.name,
          description: achievementDef.description,
          spriteId: achievementDef.image,
          autoHide: true,
          autoHideDuration: 5000
        });

        // Play the achievement sound
        await this.audioAtlasService.playSound("achievement");
      }

      return true;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return false;
    }
  }

  private async ensureAuthReady(): Promise<void> {
    await this.authService.ensureAuthReady();
  }

  /**
   * Check if an achievement is unlocked for the current user
   */
  isAchievementUnlocked(achievementId: AchievementType): boolean {
    return this.achievements.value.some((a) => a.id === achievementId && a.unlocked);
  }

  /**
   * Get achievement definitions
   */
  getAchievementDefinitions(): AchievementDefinition[] {
    return Object.values(PROBABLE_WAFFLE_ACHIEVEMENTS);
  }

  /**
   * Get a specific achievement definition
   */
  getAchievementDefinition(achievementId: AchievementType): AchievementDefinition | null {
    return PROBABLE_WAFFLE_ACHIEVEMENTS[achievementId] || null;
  }
}
