import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { AchievementNotificationService } from "../achievement-notification.service";
import { AudioAtlasService } from "../../audio-atlas/audio-atlas.service";
import { AuthService } from "../../../auth/auth.service";
import { DataAccessService } from "../../../data-access/data-access.service";
import { AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { AchievementServiceInterface } from "./achievement.service.interface";
import { PROBABLE_WAFFLE_ACHIEVEMENTS } from "./PROBABLE_WAFFLE_ACHIEVEMENTS";
import { AchievementDefinition } from "./achievement-definition";
import { AchievementType } from "./achievement-type";

interface AchievementRecord {
  id: number;
  achievement_id: string;
  user_id: string;
  unlocked_date: string;
  metadata: any;
}

@Injectable({
  providedIn: "root"
})
export class AchievementService implements AchievementServiceInterface {
  private readonly notificationService = inject(AchievementNotificationService);
  private readonly audioAtlasService = inject(AudioAtlasService);
  private readonly dataAccessService = inject(DataAccessService);
  private readonly authService = inject(AuthService);

  private achievements = new BehaviorSubject<AchievementDto[]>([]);
  private achievementsLoaded = false;

  /**
   * Observable of user achievements
   */
  public achievements$ = this.achievements.asObservable();

  /**
   * Get all achievements for the current user
   */
  async loadUserAchievements(userId?: string): Promise<AchievementDto[]> {
    // If no userId is provided, use the current user's ID
    const targetUserId = userId || this.authService.userId;

    if (!targetUserId) {
      console.warn("Cannot load achievements: No user ID provided and no user is logged in");
      return [];
    }

    try {
      // Get unlocked achievements from Supabase
      const { data: unlockedData, error: unlockedError } = await this.dataAccessService.supabase
        .from("probable_waffle_achievements")
        .select("*")
        .eq("user_id", targetUserId);

      if (unlockedError) {
        console.error("Error fetching achievements:", unlockedError);
        return [];
      }

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
          unlockedDate: unlockedRecord ? new Date(unlockedRecord.unlocked_date) : undefined,
          metadata: unlockedRecord?.metadata,
          // Add additional properties from the definition
          category: achievement.category,
          difficulty: achievement.difficulty,
          // Don't show secret achievements unless they're unlocked
          secret: achievement.secret && !unlockedRecord
        };
      });

      // If this is the current user, update the subject
      if (!userId || userId === this.authService.userId) {
        this.achievements.next(achievementList);
        this.achievementsLoaded = true;
      }

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

      // Insert the achievement record into Supabase
      const { error } = await this.dataAccessService.supabase.from("probable_waffle_achievements").insert({
        achievement_id: achievementId,
        user_id: userId,
        metadata: metadata || {}
      });

      if (error) {
        // If the error is a constraint violation (already exists), just ignore it
        if (error.code === "23505") {
          // Unique violation
          console.log(`Achievement ${achievementId} already unlocked`);
          return false;
        }

        console.error("Error unlocking achievement:", error);
        return false;
      }

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
