import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LobbiesComponent } from "./lobbies.component";
import { Component } from "@angular/core";
import { roomsServiceStub } from "../../../communicators/rooms/rooms.service.stub";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../../../shared/services/server-health.service.stub";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWafflePlayerType,
  type ProbableWaffleRoom
} from "@fuzzy-waddle/api-interfaces";

@Component({ selector: "probable-waffle-lobbies", template: "", standalone: true, imports: [] })
export class LobbiesTestingComponent {}

describe("LobbiesComponent", () => {
  let component: LobbiesComponent;
  let fixture: ComponentFixture<LobbiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: RoomsService,
          useValue: roomsServiceStub
        },
        {
          provide: ServerHealthService,
          useValue: serverHealthServiceStub
        },
        {
          provide: GameInstanceClientService,
          useValue: gameInstanceClientServiceStub
        }
      ],
      imports: [LobbiesComponent, FontAwesomeTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LobbiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("keeps full public self-hosted lobbies visible so they can still be spectated", () => {
    const fullLobby = {
      gameInstanceMetadataData: {
        gameInstanceId: "game-1",
        sessionState: GameSessionState.NotStarted,
        visibility: ProbableWaffleGameInstanceVisibility.Public,
        type: ProbableWaffleGameInstanceType.SelfHosted,
        name: "Full lobby"
      },
      players: [
        {
          controllerData: {
            playerDefinition: {
              playerType: ProbableWafflePlayerType.Human
            }
          }
        }
      ],
      spectators: []
    } satisfies Partial<ProbableWaffleRoom> as ProbableWaffleRoom;

    roomsServiceStub.rooms.set([fullLobby]);

    expect((component as any).getRoomsToJoin).toEqual([fullLobby]);
    expect((component as any).canAddSelfAsPlayer()).toBe(false);
  });

  it("keeps in-progress public self-hosted lobbies visible for spectating only", () => {
    const inProgressLobby = {
      gameInstanceMetadataData: {
        gameInstanceId: "game-2",
        sessionState: GameSessionState.InProgress,
        visibility: ProbableWaffleGameInstanceVisibility.Public,
        type: ProbableWaffleGameInstanceType.SelfHosted,
        name: "Live lobby"
      },
      players: [
        {
          controllerData: {
            playerDefinition: {
              playerType: ProbableWafflePlayerType.Human
            }
          }
        }
      ],
      spectators: []
    } satisfies Partial<ProbableWaffleRoom> as ProbableWaffleRoom;

    roomsServiceStub.rooms.set([inProgressLobby]);
    (component as any).select(inProgressLobby);

    expect((component as any).getRoomsToJoin).toEqual([inProgressLobby]);
    expect((component as any).canAddSelfAsPlayer()).toBe(false);
    expect((component as any).canAddSelfAsSpectator()).toBe(true);
  });
});
