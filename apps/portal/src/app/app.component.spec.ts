import { TestBed, waitForAsync } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { serverHealthServiceStub } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service.stub";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import { SwRefreshTestingComponent } from "@fuzzy-waddle/platform-game-host/angular/components/sw-refresh/sw-refresh.component.spec";
import { SwRefreshComponent } from "@fuzzy-waddle/platform-game-host/angular/components/sw-refresh/sw-refresh.component";
import { provideRouter } from "@angular/router";

describe("AppComponent", () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent, SwRefreshTestingComponent],
      providers: [
        provideRouter([]),
        {
          provide: ServerHealthService,
          useValue: serverHealthServiceStub
        },
        {
          provide: AuthService,
          useValue: authServiceStub
        }
      ]
    })
      .overrideComponent(AppComponent, {
        remove: {
          imports: [SwRefreshComponent]
        },
        add: {
          imports: [SwRefreshTestingComponent]
        }
      })
      .compileComponents();
  }));

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
