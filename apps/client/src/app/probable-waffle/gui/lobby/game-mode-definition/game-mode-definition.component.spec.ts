import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GameModeDefinitionComponent } from "./game-mode-definition.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameInstanceClientService } from "../../../../little-muncher/main/communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../../little-muncher/main/communicators/game-instance-client.service.spec";

@Component({
  selector: "probable-waffle-game-mode-definition",
  template: "",
  standalone: true,
  imports: [CommonModule]
})
export class GameModeDefinitionTestingComponent {}

describe("GameModeDefinitionComponent", () => {
  let component: GameModeDefinitionComponent;
  let fixture: ComponentFixture<GameModeDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameModeDefinitionComponent, FormsModule],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(GameModeDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
