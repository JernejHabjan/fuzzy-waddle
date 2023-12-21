import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SkirmishComponent } from "./skirmish.component";
import { Component } from "@angular/core";
import { PlayerDefinitionTestingComponent } from "./player-definition/player-definition.component.spec";
import { MapDefinitionTestingComponent } from "./map-definition/map-definition.component.spec";
import { GameModeDefinitionTestingComponent } from "./game-mode-definition/game-mode-definition.component.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";

@Component({ selector: "fuzzy-waddle-skirmish", template: "" })
export class SkirmishTestingComponent {}

describe("SkirmishComponent", () => {
  let component: SkirmishComponent;
  let fixture: ComponentFixture<SkirmishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      declarations: [
        SkirmishComponent,
        PlayerDefinitionTestingComponent,
        MapDefinitionTestingComponent,
        GameModeDefinitionTestingComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SkirmishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
