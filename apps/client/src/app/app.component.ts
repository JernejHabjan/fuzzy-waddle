import type { OnInit } from "@angular/core";
import { Component, computed, inject } from "@angular/core";
import { AuthService } from "./auth/auth.service";
import { ServerHealthService } from "./shared/services/server-health.service";
import { SwRefreshComponent } from "./shared/components/sw-refresh/sw-refresh.component";
import { RouterOutlet } from "@angular/router";
import { AngularHost } from "./shared/consts";
import { ToastContainerComponent } from "./shared/components/toast-container.component";
import { isTauri, TauriService } from "./shared/services/tauri.service";
import { TauriSplashComponent } from "./shared/components/tauri-splash/tauri-splash.component";
import { TauriTitlebarComponent } from "./shared/components/tauri-titlebar/tauri-titlebar.component";

@Component({
  selector: "fuzzy-waddle-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  host: AngularHost.contentFlexFullHeight,
  imports: [RouterOutlet, SwRefreshComponent, ToastContainerComponent, TauriSplashComponent, TauriTitlebarComponent]
})
export class AppComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);
  protected readonly tauriService = inject(TauriService);
  protected readonly isTauri = isTauri;

  /** Push content below the fixed title bar when it is visible (Tauri, windowed mode). */
  protected readonly titlebarPadding = computed(() =>
    isTauri() && !this.tauriService.windowIsFullscreen() ? "32px" : "0"
  );

  ngOnInit() {
    // Don't block rendering - let health check and auth run in background
    // noinspection JSIgnoredPromiseFromCall
    this.serverHealthService.checkHealth();
    // noinspection JSIgnoredPromiseFromCall
    this.authService.autoSignIn();
    if (isTauri()) {
      // noinspection JSIgnoredPromiseFromCall
      this.tauriService.syncWindowState();
      // noinspection JSIgnoredPromiseFromCall
      this.tauriService.initDeepLinkListener();
    }
  }
}
