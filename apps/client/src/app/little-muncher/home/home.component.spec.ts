import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomeComponent } from "./home.component";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { SpectateTestComponent } from "./spectate/spectate.component.spec";
import { RouterTestingModule } from "@angular/router/testing";
import { SpectateComponent } from "./spectate/spectate.component";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
@Component({ selector: "little-muncher-home", template: "", standalone: true, imports: [CommonModule] })
export class HomeTestingComponent {}

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

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
        }
      ],
      imports: [HomeComponent, RouterTestingModule]
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
