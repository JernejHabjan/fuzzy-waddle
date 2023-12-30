import { Component, inject } from "@angular/core";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { AuthService } from "../../../auth/auth.service";

@Component({
  templateUrl: "./online.component.html",
  styleUrls: ["./online.component.scss"]
})
export class OnlineComponent {
  protected selectedTab: string = "join";
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly authService = inject(AuthService);

  protected selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
