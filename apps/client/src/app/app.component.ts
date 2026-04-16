import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { AuthService } from "./auth/auth.service";
import { ServerHealthService } from "./shared/services/server-health.service";
import { SwRefreshComponent } from "./shared/components/sw-refresh/sw-refresh.component";
import { Router, RouterOutlet } from "@angular/router";
import { AngularHost } from "./shared/consts";
import { ToastContainerComponent } from "./shared/components/toast-container.component";
import { TauriService } from "./shared/services/tauri.service";

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
  private readonly tauriService = inject(TauriService);
  private readonly router = inject(Router);

  ngOnInit() {
    // Don't block rendering - let health check and auth run in background
    // noinspection JSIgnoredPromiseFromCall
    this.serverHealthService.checkHealth();
    // noinspection JSIgnoredPromiseFromCall
    this.authService.autoSignIn();
    if (this.tauriService.isTauri) {
      // noinspection JSIgnoredPromiseFromCall
      this.router.navigateByUrl("/aota");
    }
  }
}
