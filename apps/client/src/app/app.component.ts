import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { AuthService } from "./auth/auth.service";
import { ServerHealthService } from "./shared/services/server-health.service";
import { SwRefreshComponent } from "./shared/components/sw-refresh/sw-refresh.component";
import { RouterOutlet } from "@angular/router";
import { AngularHost } from "./shared/consts";
import { ToastContainerComponent } from "./shared/components/toast-container.component";

@Component({
  selector: "fuzzy-waddle-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  host: AngularHost.contentFlexFullHeight,
  imports: [RouterOutlet, SwRefreshComponent, ToastContainerComponent]
})
export class AppComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);

  async ngOnInit() {
    await Promise.all([this.serverHealthService.checkHealth(), this.authService.autoSignIn()]);
  }
}
