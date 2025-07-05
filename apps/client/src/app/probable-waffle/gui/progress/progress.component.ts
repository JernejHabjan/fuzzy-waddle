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
import { AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../environments/environment";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faShare, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

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
    const shareUrl =
      window.location.origin + this.router.createUrlTree(["/probable-waffle/progress", userId]).toString();

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
}
