import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProfileComponent } from "./profile.component";
import { ProfileNavTestingComponent } from "./profile-nav/profile-nav.component.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.stub";
import { ProfileNavComponent } from "./profile-nav/profile-nav.component";

describe("ProfileComponent", () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    })
      .overrideComponent(ProfileComponent, {
        remove: {
          imports: [ProfileNavComponent]
        },
        add: {
          imports: [ProfileNavTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
