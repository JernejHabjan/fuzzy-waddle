import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.stub";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.stub";
import { SpectateTestComponent } from "./spectate/spectate.component.spec";
import { SpectateComponent } from "./spectate/spectate.component";
import { Component } from "@angular/core";
import { provideRouter } from "@angular/router";

@Component({ selector: "little-muncher-home", template: "", standalone: true, imports: [] })
export class HomeTestingComponent {}

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
      imports: [HomeComponent]
    })
      .overrideComponent(HomeComponent, {
        remove: {
          imports: [SpectateComponent]
        },
        add: {
          imports: [SpectateTestComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
