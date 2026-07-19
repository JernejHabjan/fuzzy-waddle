import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlayerDefinitionComponent } from "./player-definition.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import { AvatarProviderService } from "@fuzzy-waddle/platform-identity/client/avatar-provider/avatar-provider.service";
import { provideRouter } from "@angular/router";
import { CurrentUserProfileService } from "@fuzzy-waddle/platform-identity/client/profile-data/current-user-profile.service";
import { currentUserProfileServiceStub } from "@fuzzy-waddle/platform-identity/client/profile-data/current-user-profile.service.stub";
import { UserInstanceService } from "@fuzzy-waddle/platform-identity/client/profile/user-instance.service";
import { userInstanceServiceStub } from "@fuzzy-waddle/platform-identity/client/profile/user-instance.service.stub";

@Component({ selector: "probable-waffle-player-definition", template: "", standalone: true, imports: [] })
export class PlayerDefinitionTestingComponent {}

describe("PlayerDefinitionComponent", () => {
  let component: PlayerDefinitionComponent;
  let fixture: ComponentFixture<PlayerDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDefinitionComponent, FontAwesomeTestingModule, FormsModule],
      providers: [
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
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
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
