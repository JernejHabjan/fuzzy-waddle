import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LobbyComponent } from "./lobby.component";
import { Component } from "@angular/core";
import { PlayerDefinitionTestingComponent } from "./player-definition/player-definition.component.spec";
import { MapDefinitionTestingComponent } from "./map-definition/map-definition.component.spec";
import { GameModeDefinitionTestingComponent } from "./game-mode-definition/game-mode-definition.component.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { SpectatorsGridTestingComponent } from "./spectators-grid/spectators-grid.component.spec";
import { MapPlayerDefinitionsService } from "./map-player-definitions.service";
import { mapPlayerDefinitionsServiceStub } from "./map-player-definitions.service.spec";

@Component({ selector: "probable-waffle-lobby", template: "" })
export class LobbyTestingComponent {}

describe("ProbableWaffleLobbyLobbyComponent", () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: MapPlayerDefinitionsService, useValue: mapPlayerDefinitionsServiceStub }
      ],
      declarations: [
        LobbyComponent,
        PlayerDefinitionTestingComponent,
        MapDefinitionTestingComponent,
        GameModeDefinitionTestingComponent,
        SpectatorsGridTestingComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
