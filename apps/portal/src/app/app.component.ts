import type { OnInit } from "@angular/core";
import { Component, computed, inject } from "@angular/core";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { SwRefreshComponent } from "@fuzzy-waddle/platform-game-host/angular/components/sw-refresh/sw-refresh.component";
import { RouterOutlet } from "@angular/router";
import { AngularHost } from "@fuzzy-waddle/platform-game-host/angular/consts";
import { ToastContainerComponent } from "@fuzzy-waddle/platform-game-host/angular/components/toast-container.component";
import { isTauri, TauriService } from "@fuzzy-waddle/platform-game-host/angular/services/tauri.service";
import { TauriSplashComponent } from "@fuzzy-waddle/platform-game-host/angular/components/tauri-splash/tauri-splash.component";
import { TauriTitlebarComponent } from "@fuzzy-waddle/platform-game-host/angular/components/tauri-titlebar/tauri-titlebar.component";

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
