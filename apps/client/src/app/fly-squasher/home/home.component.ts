import { Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { ServerHealthService } from "../../shared/services/server-health.service";

@Component({
  selector: "fly-squasher-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent {
  protected readonly faExclamationTriangle = faExclamationTriangle;

  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
}
