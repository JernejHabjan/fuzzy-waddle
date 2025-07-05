import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";

import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { CenterWrapperComponent } from "../../../shared/components/center-wrapper/center-wrapper.component";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { AtlasSpriteComponent } from "../../components/atlas-sprite/atlas-sprite.component";

import { AchievementNotificationService } from "../../services/achievement-notification.service";

@Component({
  templateUrl: "./progress.component.html",
  styleUrls: ["./progress.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CenterWrapperComponent, HomeNavComponent, AtlasSpriteComponent],
  host: AngularHost.contentFlexFullHeight,
  standalone: true
})
export class ProgressComponent {
  protected readonly gameInstanceService = inject(DEPRECATED_gameInstanceService);
  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
  private readonly AchievementNotificationService = inject(AchievementNotificationService);
  constructor() {
    setTimeout(() => {
      console.warn("this is just for test");
      this.AchievementNotificationService.showAchievementNotification({
        title: "New Spell",
        spriteId: "actor_info_icons/element.png",
        autoHide: true,
        description: 'You unlocked new "Frostbolt" spell',
        autoHideDuration: 3000
      });
    }, 1000);
  }
}
