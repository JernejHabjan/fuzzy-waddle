import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HighScoreComponent } from "./high-score.component";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { HighScoreService } from "./high-score.service";
import { highScoreServiceStub } from "./high-score.service.spec";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { RouterTestingModule } from "@angular/router/testing";

describe("HighScoreComponent", () => {
  let component: HighScoreComponent;
  let fixture: ComponentFixture<HighScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ServerHealthService,
          useValue: serverHealthServiceStub
        },
        {
          provide: AuthService,
          useValue: authServiceStub
        },
        {
          provide: HighScoreService,
          useValue: highScoreServiceStub
        }
      ],
      imports: [HighScoreComponent, FontAwesomeTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HighScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
