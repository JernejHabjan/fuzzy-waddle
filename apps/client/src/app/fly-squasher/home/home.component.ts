import { Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { ServerHealthService } from "../../shared/services/server-health.service";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";

@Component({
  selector: "fly-squasher-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [FaIconComponent, RouterLink],
  host: AngularHost.contentFlexFullHeight
})
export class HomeComponent {
  protected readonly faExclamationTriangle = faExclamationTriangle;

  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
}
