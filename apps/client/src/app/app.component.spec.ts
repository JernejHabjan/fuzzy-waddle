import { TestBed, waitForAsync } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ServerHealthService } from "./shared/services/server-health.service";
import { serverHealthServiceStub } from "./shared/services/server-health.service.spec";
import { AuthService } from "./auth/auth.service";
import { authServiceStub } from "./auth/auth.service.spec";
import { SwRefreshTestingComponent } from "./shared/components/sw-refresh/sw-refresh.component.spec";
import { HomeComponent } from "./little-muncher/home/home.component";
import { SwRefreshComponent } from "./shared/components/sw-refresh/sw-refresh.component";

describe("AppComponent", () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, SwRefreshTestingComponent],
      providers: [
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
