import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProgressComponent } from "./progress.component";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { serverHealthServiceStub } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service.stub";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import { provideRouter } from "@angular/router";
import { AchievementService } from "../../services/achievement/achievement.service";
import { achievementServiceStub } from "../../services/achievement/achievement.service.stub";

describe("ProgressComponent", () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [
        provideRouter([]),
        { provide: ServerHealthService, useValue: serverHealthServiceStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: AchievementService, useValue: achievementServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
