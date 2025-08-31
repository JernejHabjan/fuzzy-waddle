import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";

import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { CenterWrapperComponent } from "../../../shared/components/center-wrapper/center-wrapper.component";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { AtlasSpriteComponent } from "../../components/atlas-sprite/atlas-sprite.component";
import { DatePipe, Location } from "@angular/common";

import { AchievementService } from "../../services/achievement/achievement.service";
import { AchievementType } from "../../services/achievement/achievement-type";
import { toSignal } from "@angular/core/rxjs-interop";
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from "@ng-bootstrap/ng-bootstrap";
import type { AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../environments/environment";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faShare, faArrowLeft, faLock } from "@fortawesome/free-solid-svg-icons";

// Interface for achievement categories for display
interface AchievementCategory {
  name: string | null;
  achievements: AchievementDto[];
}

@Component({
  templateUrl: "./progress.component.html",
  styleUrls: ["./progress.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CenterWrapperComponent,
    HomeNavComponent,
    AtlasSpriteComponent,
    DatePipe,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    FontAwesomeModule
  ],
  host: AngularHost.contentFlexFullHeight,
  standalone: true
})
export class ProgressComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly achievementService = inject(AchievementService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly location = inject(Location);

  // Font Awesome icons
  protected readonly faShare = faShare;
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faLock = faLock;

  // Signal for user ID being viewed
  protected readonly viewingUserId = signal<string | null>(null);
  protected readonly isViewingOtherUser = signal<boolean>(false);

  // Signal for the list of achievements
  protected readonly achievements = toSignal(this.achievementService.achievements$, { initialValue: [] });

  // Filter states
  protected readonly selectedCategory = signal<string | null>(null);
  protected readonly showUnlockedOnly = signal<boolean>(false);
  protected readonly showLockedOnly = signal<boolean>(false);

  // Categories derived from achievement definitions
  protected readonly categories = Object.values(this.achievementService.getAchievementDefinitions())
    .filter((a) => a.category)
    .map((a) => a.category as string)
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    .sort();

  ngOnInit() {
    // Check if we have a userId in the route
    this.route.paramMap.subscribe((params) => {
      const userId = params.get("userId");

      if (userId) {
        // We're viewing another user's achievements
        this.viewingUserId.set(userId);
        this.isViewingOtherUser.set(userId !== this.authService.userId);

        // Load achievements for the specified user
        this.achievementService.loadUserAchievements(userId);
      } else {
        // Load achievements for the current user
        this.viewingUserId.set(this.authService.userId);
        this.isViewingOtherUser.set(false);
        this.achievementService.loadUserAchievements();
      }
    });

    if (!environment.production) this.setTestAchievement();
  }

  private setTestAchievement() {
    // For testing - unlock an achievement
    setTimeout(async () => {
      console.warn("just for testing - remove later");
      this.achievementService.unlockAchievement(AchievementType.FIRST_STEPS);
    }, 2000);
  }

  /**
   * Returns an array of indices for secret achievements that haven't been unlocked yet
   * This helps us show "???" placeholders for secret achievements in the UI
   * @returns Array of indices for secret achievements
   */
  protected getSecretAchievements(): AchievementDto[] {
    // Get all achievements including secret ones
    const allAchievements = this.achievements();

    // Filter for only secret achievements that haven't been unlocked
    return allAchievements.filter((a) => a.secret && !a.unlocked);
  }

  /**
   * Filter achievements by category and unlock status
   */
  protected getFilteredAchievements(): AchievementDto[] {
    let filtered = this.achievements();

    // Filter by category if selected
    if (this.selectedCategory()) {
      filtered = filtered.filter((a) => a.category === this.selectedCategory());

      // Sort by unlock status (unlocked first)
      filtered.sort((a, b) => {
        // Unlocked achievements first
        if (a.unlocked !== b.unlocked) {
          return a.unlocked ? -1 : 1;
        }
        // Then alphabetically by name
        return a.name.localeCompare(b.name);
      });
    } else {
      // When no category is selected, group by category
      // First get all categories from the filtered achievements
      const categoriesInAchievements = filtered
        .map((a) => a.category)
        .filter((c, i, self) => c && self.indexOf(c) === i) as string[];

      // Sort categories alphabetically
      categoriesInAchievements.sort();

      // Create a new array with achievements grouped by category
      const groupedFiltered: AchievementDto[] = [];

      // First add achievements without a category (if any)
      const uncategorized = filtered.filter((a) => !a.category);

      // Sort uncategorized with unlocked first
      uncategorized.sort((a, b) => {
        if (a.unlocked !== b.unlocked) {
          return a.unlocked ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      groupedFiltered.push(...uncategorized);

      // Then add achievements for each category
      for (const category of categoriesInAchievements) {
        const categoryAchievements = filtered.filter((a) => a.category === category);

        // Sort each category with unlocked first
        categoryAchievements.sort((a, b) => {
          if (a.unlocked !== b.unlocked) {
            return a.unlocked ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

        groupedFiltered.push(...categoryAchievements);
      }

      filtered = groupedFiltered;
    }

    // Filter by unlock status
    if (this.showUnlockedOnly()) {
      filtered = filtered.filter((a) => a.unlocked);
    } else if (this.showLockedOnly()) {
      filtered = filtered.filter((a) => !a.unlocked);
    }

    // Hide secret achievements that aren't unlocked
    filtered = filtered.filter((a) => !a.secret);

    return filtered;
  }

  /**
   * Set the category filter
   */
  protected setCategory(category: string | null) {
    this.selectedCategory.set(category);
  }

  /**
   * Toggle unlocked-only filter
   */
  protected toggleUnlockedOnly() {
    const current = this.showUnlockedOnly();
    this.showUnlockedOnly.set(!current);

    // If turning on unlocked only, turn off locked only
    if (!current) {
      this.showLockedOnly.set(false);
    }
  }

  /**
   * Toggle locked-only filter
   */
  protected toggleLockedOnly() {
    const current = this.showLockedOnly();
    this.showLockedOnly.set(!current);

    // If turning on locked only, turn off unlocked only
    if (!current) {
      this.showUnlockedOnly.set(false);
    }
  }

  /**
   * Share the current user's achievements page
   */
  protected shareAchievements() {
    const userId = this.viewingUserId();
    if (!userId) return;

    // Create the share URL
    const shareUrl = window.location.origin + this.router.createUrlTree(["/aota/progress", userId]).toString();

    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: "Check out my achievements!",
          url: shareUrl
        })
        .catch((err) => {
          console.error("Error sharing:", err);
          this.copyToClipboard(shareUrl);
        });
    } else {
      // Fallback to clipboard copy
      this.copyToClipboard(shareUrl);
    }
  }

  /**
   * Helper method to copy text to clipboard
   */
  private copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Share link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }

  /**
   * Go back to previous page
   */
  protected goBack() {
    this.location.back();
  }

  /**
   * Get achievements organized by category with unlocked ones first within each category
   */
  protected getCategorizedAchievements(): AchievementCategory[] {
    // If a specific category is selected, just return that as a single group
    if (this.selectedCategory()) {
      let filtered = this.achievements().filter((a) => a.category === this.selectedCategory());

      // Apply unlock status filter if needed
      if (this.showUnlockedOnly()) {
        filtered = filtered.filter((a) => a.unlocked);
      } else if (this.showLockedOnly()) {
        filtered = filtered.filter((a) => !a.unlocked);
      }

      // Filter out secret achievements that aren't unlocked
      filtered = filtered.filter((a) => !a.secret);

      // Sort with unlocked first
      filtered.sort((a, b) => {
        if (a.unlocked !== b.unlocked) {
          return a.unlocked ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return [{ name: this.selectedCategory(), achievements: filtered }];
    }

    // Start with all achievements
    let allAchievements = this.achievements();

    // Apply unlock status filter if needed
    if (this.showUnlockedOnly()) {
      allAchievements = allAchievements.filter((a) => a.unlocked);
    } else if (this.showLockedOnly()) {
      allAchievements = allAchievements.filter((a) => !a.unlocked);
    }

    // Hide secret achievements that aren't unlocked
    allAchievements = allAchievements.filter((a) => !a.secret);

    // Get all categories present in the filtered achievements
    const categoriesInAchievements = allAchievements
      .map((a) => a.category)
      .filter((c, i, self) => self.indexOf(c) === i) as (string | null)[];

    // Sort categories alphabetically, but keep null (uncategorized) first
    categoriesInAchievements.sort((a, b) => {
      if (a === null) return -1;
      if (b === null) return 1;
      return a.localeCompare(b);
    });

    // Create the category groups
    const categorizedAchievements: AchievementCategory[] = [];

    for (const category of categoriesInAchievements) {
      const categoryAchievements = allAchievements.filter((a) => a.category === category);

      // Sort each category with unlocked first
      categoryAchievements.sort((a, b) => {
        if (a.unlocked !== b.unlocked) {
          return a.unlocked ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      categorizedAchievements.push({
        name: category,
        achievements: categoryAchievements
      });
    }

    return categorizedAchievements;
  }

  /**
   * Get the total number of achievements (excluding secret ones that aren't unlocked)
   */
  protected getTotalAchievementsCount(): number {
    const allAchievements = this.achievements();
    // Count all non-secret achievements plus unlocked secret achievements
    return allAchievements.filter((a) => !a.secret || a.unlocked).length;
  }

  /**
   * Get the number of unlocked achievements
   */
  protected getUnlockedCount(): number {
    return this.achievements().filter((a) => a.unlocked).length;
  }

  /**
   * Calculate the percentage of unlocked achievements
   */
  protected getUnlockedPercentage(): number {
    const total = this.getTotalAchievementsCount();
    if (total === 0) return 0;

    const unlocked = this.getUnlockedCount();
    const percentage = Math.round((unlocked / total) * 100);
    return percentage;
  }
}
