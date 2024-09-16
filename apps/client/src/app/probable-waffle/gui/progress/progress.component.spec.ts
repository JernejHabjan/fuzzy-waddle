import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProgressComponent } from "./progress.component";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../../shared/services/server-health.service.spec";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { provideRouter } from "@angular/router";

describe("ProfileComponent", () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
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
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
