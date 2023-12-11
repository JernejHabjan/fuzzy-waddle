import { Component } from "@angular/core";
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

  constructor(
    protected readonly authService: AuthService,
    protected readonly serverHealthService: ServerHealthService
  ) {}
}
