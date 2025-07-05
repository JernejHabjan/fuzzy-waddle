import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";

import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { CenterWrapperComponent } from "../../../shared/components/center-wrapper/center-wrapper.component";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { AtlasSpriteComponent } from "../../components/atlas-sprite/atlas-sprite.component";
import { DatePipe } from "@angular/common";

import { AchievementNotificationService } from "../../services/achievement-notification.service";

@Component({
  templateUrl: "./progress.component.html",
  styleUrls: ["./progress.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CenterWrapperComponent, HomeNavComponent, AtlasSpriteComponent, DatePipe],
  host: AngularHost.contentFlexFullHeight,
  standalone: true
})
export class ProgressComponent {
  protected readonly gameInstanceService = inject(DEPRECATED_gameInstanceService);
  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
  private readonly achievementNotificationService = inject(AchievementNotificationService);

  // Total number of achievements to display (real + placeholders)
  private readonly targetAchievementCount = 12;

  constructor() {
    // For testing purposes - show an achievement notification
    setTimeout(() => {
      this.achievementNotificationService.showAchievementNotification({
        title: "New Spell",
        spriteId: "actor_info_icons/element.png",
        autoHide: true,
        description: 'You unlocked new "Frostbolt" spell',
        autoHideDuration: 3000
      });
    }, 1000);
  }

  /**
   * Creates placeholder achievements to fill empty spaces in the grid
   * @param currentCount Number of real achievements
   * @returns Array with placeholder items
   */
  protected getPlaceholders(currentCount: number): number[] {
    const placeholdersNeeded = Math.max(0, this.targetAchievementCount - currentCount);
    return Array(placeholdersNeeded)
      .fill(0)
      .map((_, i) => i);
  }
}
