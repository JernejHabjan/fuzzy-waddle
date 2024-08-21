import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LobbyComponent } from "./lobby.component";
import { Component } from "@angular/core";
import { PlayerDefinitionTestingComponent } from "./player-definition/player-definition.component.spec";
import { MapDefinitionTestingComponent } from "./map-definition/map-definition.component.spec";
import { GameModeDefinitionTestingComponent } from "./game-mode-definition/game-mode-definition.component.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { SpectatorsGridTestingComponent } from "./spectators-grid/spectators-grid.component.spec";
import { LobbyChatTestingComponent } from "./lobby-chat/lobby-chat.component.spec";
import { PlayerDefinitionComponent } from "./player-definition/player-definition.component";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import { GameModeDefinitionComponent } from "./game-mode-definition/game-mode-definition.component";
import { SpectatorsGridComponent } from "./spectators-grid/spectators-grid.component";
import { LobbyChatComponent } from "./lobby-chat/lobby-chat.component";

@Component({ selector: "probable-waffle-lobby", template: "", standalone: true, imports: [] })
export class LobbyTestingComponent {}

describe("ProbableWaffleLobbyLobbyComponent", () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [LobbyComponent]
    })
      .overrideComponent(LobbyComponent, {
        remove: {
          imports: [
            PlayerDefinitionComponent,
            MapDefinitionComponent,
            GameModeDefinitionComponent,
            SpectatorsGridComponent,
            LobbyChatComponent
          ]
        },
        add: {
          imports: [
            PlayerDefinitionTestingComponent,
            MapDefinitionTestingComponent,
            GameModeDefinitionTestingComponent,
            SpectatorsGridTestingComponent,
            LobbyChatTestingComponent
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
