import type { OnInit } from "@angular/core";
import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { SwRefreshComponent } from "@fuzzy-waddle/platform-game-host/angular/components/sw-refresh/sw-refresh.component";
import { TauriSplashComponent } from "@fuzzy-waddle/platform-game-host/angular/components/tauri-splash/tauri-splash.component";
import { TauriTitlebarComponent } from "@fuzzy-waddle/platform-game-host/angular/components/tauri-titlebar/tauri-titlebar.component";
import { ToastContainerComponent } from "@fuzzy-waddle/platform-game-host/angular/components/toast-container.component";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import {
  isTauri,
  TauriService
} from "@fuzzy-waddle/platform-game-host/angular/services/tauri.service";

@Component({
  selector: "fuzzy-waddle-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SwRefreshComponent, ToastContainerComponent, TauriSplashComponent, TauriTitlebarComponent]
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);
  protected readonly tauriService = inject(TauriService);
  protected readonly isTauri = isTauri;

  protected readonly titlebarPadding = computed(() =>
    isTauri() && !this.tauriService.windowIsFullscreen() ? "32px" : "0"
  );

  ngOnInit(): void {
    void this.serverHealthService.checkHealth();
    void this.authService.autoSignIn();
    if (isTauri()) {
      void this.tauriService.syncWindowState();
      void this.tauriService.initDeepLinkListener();
    }
  }
}
