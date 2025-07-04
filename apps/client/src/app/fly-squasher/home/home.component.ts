import { Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { ServerHealthService } from "../../shared/services/server-health.service";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";
import { CenterWrapperComponent } from "../../shared/components/center-wrapper/center-wrapper.component";

@Component({
  selector: "fly-squasher-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  imports: [FaIconComponent, RouterLink, HomeNavComponent, CenterWrapperComponent],
  host: AngularHost.contentFlexFullHeight
})
export class HomeComponent {
  protected readonly faExclamationTriangle = faExclamationTriangle;

  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
}
