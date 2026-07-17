import { TestBed } from "@angular/core/testing";
import { provideRouter, RouterOutlet } from "@angular/router";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { TauriService } from "@fuzzy-waddle/platform-game-host/angular/services/tauri.service";
import { signal } from "@angular/core";
import { AppComponent } from "./app.component";

describe("AppComponent", () => {
  const authService = { autoSignIn: jest.fn() };
  const serverHealthService = { checkHealth: jest.fn() };
  const tauriService = {
    windowIsFullscreen: signal(true),
    syncWindowState: jest.fn(),
    initDeepLinkListener: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ServerHealthService, useValue: serverHealthService },
        { provide: TauriService, useValue: tauriService }
      ]
    })
      .overrideComponent(AppComponent, {
        set: {
          template: "<router-outlet />",
          imports: [RouterOutlet]
        }
      })
      .compileComponents();
  });

  it("starts authentication and health checks", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(authService.autoSignIn).toHaveBeenCalled();
    expect(serverHealthService.checkHealth).toHaveBeenCalled();
  });
});
