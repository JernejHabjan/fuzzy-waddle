import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlayerDefinitionComponent } from "./player-definition.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { AuthService } from "../../../../auth/auth.service";
import { authServiceStub } from "../../../../auth/auth.service.stub";
import { AvatarProviderService } from "../../../../shared/components/chat/avatar-provider/avatar-provider.service";
import { provideRouter } from "@angular/router";
import { CurrentUserProfileService } from "../../../../data-access/profile/current-user-profile.service";
import { currentUserProfileServiceStub } from "../../../../data-access/profile/current-user-profile.service.stub";
import { UserInstanceService } from "../../../../home/profile/user-instance.service";
import { userInstanceServiceStub } from "../../../../home/profile/user-instance.service.stub";

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
