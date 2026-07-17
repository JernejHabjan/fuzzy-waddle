import { TestBed, waitForAsync } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { ServerHealthService } from "./shared/services/server-health.service";
import { serverHealthServiceStub } from "./shared/services/server-health.service.stub";
import { AuthService } from "./auth/auth.service";
import { authServiceStub } from "./auth/auth.service.stub";
import { SwRefreshTestingComponent } from "./shared/components/sw-refresh/sw-refresh.component.spec";
import { SwRefreshComponent } from "./shared/components/sw-refresh/sw-refresh.component";
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
