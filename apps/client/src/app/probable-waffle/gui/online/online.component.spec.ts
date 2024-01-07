import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OnlineComponent } from "./online.component";
import { provideRouter } from "@angular/router";
import { HomeNavTestingComponent } from "../../../shared/components/home-nav/home-nav.component.spec";
import { MatchmakingTestingComponent } from "./matchmaking/matchmaking.component.spec";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../../shared/services/server-health.service.spec";
import { LobbiesTestingComponent } from "./lobbies/lobbies.component.spec";
import { HostTestingComponent } from "./host/host.component.spec";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { MatchmakingComponent } from "./matchmaking/matchmaking.component";
import { LobbiesComponent } from "./lobbies/lobbies.component";
import { HostComponent } from "./host/host.component";
import { GameModeDefinitionComponent } from "../lobby/game-mode-definition/game-mode-definition.component";
import { GameModeDefinitionTestingComponent } from "../lobby/game-mode-definition/game-mode-definition.component.spec";

describe("OnlineComponent", () => {
  let component: OnlineComponent;
  let fixture: ComponentFixture<OnlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnlineComponent],
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
    })
      .overrideComponent(OnlineComponent, {
        remove: {
          imports: [
            HomeNavComponent,
            MatchmakingComponent,
            GameModeDefinitionComponent,
            LobbiesComponent,
            HostComponent
          ]
        },
        add: {
          imports: [
            HomeNavTestingComponent,
            MatchmakingTestingComponent,
            GameModeDefinitionTestingComponent,
            LobbiesTestingComponent,
            HostTestingComponent
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(OnlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
