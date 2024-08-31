import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LobbiesComponent } from "./lobbies.component";
import { Component } from "@angular/core";
import { roomsServiceStub } from "../../../communicators/rooms/rooms.service.spec";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../../../shared/services/server-health.service.spec";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

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
});
