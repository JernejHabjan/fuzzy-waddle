import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import type { OnInit } from "@angular/core";
import { AuthService } from "@fuzzy-waddle/client/app/auth/auth.service";
import { ServerHealthService } from "@fuzzy-waddle/client/app/shared/services/server-health.service";
import { RouterOutlet } from "@angular/router";
import { AngularHost } from "@fuzzy-waddle/client/app/shared/consts";
import { ToastContainerComponent } from "@fuzzy-waddle/client/app/shared/components/toast-container.component";

@Component({
  selector: "fuzzy-waddle-root",
  template: `
    <main class="h-100">
      <router-outlet />
    </main>
    <app-toast-container />
  `,
  host: AngularHost.contentFlexFullHeight,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainerComponent]
})
export class AppComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);

  ngOnInit() {
    // Don't block rendering - let health check and auth run in background
    // noinspection JSIgnoredPromiseFromCall
    this.serverHealthService.checkHealth();
    // noinspection JSIgnoredPromiseFromCall
    this.authService.autoSignIn();
  }
}
