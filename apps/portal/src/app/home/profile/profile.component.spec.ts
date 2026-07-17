import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProfileComponent } from "./profile.component";
import { ProfileNavTestingComponent } from "./profile-nav/profile-nav.component.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.stub";
import { ProfileNavComponent } from "./profile-nav/profile-nav.component";
import { CurrentUserProfileService } from "../../data-access/profile/current-user-profile.service";
import { currentUserProfileServiceStub } from "../../data-access/profile/current-user-profile.service.stub";
import { AvatarProviderService } from "../../shared/components/chat/avatar-provider/avatar-provider.service";
import { UserInstanceService } from "./user-instance.service";
import { userInstanceServiceStub } from "./user-instance.service.stub";
import { provideRouter } from "@angular/router";

describe("ProfileComponent", () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: CurrentUserProfileService, useValue: currentUserProfileServiceStub },
        { provide: UserInstanceService, useValue: userInstanceServiceStub },
        {
          provide: AvatarProviderService,
          useValue: {
            getAvatar: () => "https://example.com/avatar.png"
          }
        }
      ]
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
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should render profile content after loading", async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Test User");
    expect(text).not.toContain("Loading profile data...");
  });
});
