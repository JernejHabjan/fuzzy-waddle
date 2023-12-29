import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomeComponent } from "./home.component";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { SpectateTestComponent } from "./spectate/spectate.component.spec";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent, SpectateTestComponent],
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
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
