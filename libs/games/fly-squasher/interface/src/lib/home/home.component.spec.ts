import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { ServerHealthService } from "@fuzzy-waddle/portal/shared/services/server-health.service";
import { serverHealthServiceStub } from "@fuzzy-waddle/portal/shared/services/server-health.service.stub";
import { AuthService } from "@fuzzy-waddle/portal/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/portal/auth/auth.service.stub";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { provideRouter } from "@angular/router";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
      ],
      imports: [HomeComponent, FontAwesomeTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
