import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";

import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { CenterWrapperComponent } from "../../../shared/components/center-wrapper/center-wrapper.component";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";

@Component({
  templateUrl: "./progress.component.html",
  styleUrls: ["./progress.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CenterWrapperComponent, HomeNavComponent],
  host: AngularHost.contentFlexFullHeight
})
export class ProgressComponent {
  protected readonly gameInstanceService = inject(DEPRECATED_gameInstanceService);
  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
}
