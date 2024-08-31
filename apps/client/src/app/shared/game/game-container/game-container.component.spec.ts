import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GameContainerComponent } from "./game-container.component";
import { Component, Input } from "@angular/core";
import { BaseGameData } from "../phaser/game/base-game-data";
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherCommunicatorService } from "../../../little-muncher/main/communicators/little-muncher-communicator.service";

@Component({ selector: "fuzzy-waddle-game-container", template: "", standalone: true, imports: [] })
export class GameContainerTestingComponent {
  @Input({ required: true }) gameConfig!: Phaser.Types.Core.GameConfig;
  @Input({ required: true }) gameData!: BaseGameData<
    LittleMuncherCommunicatorService,
    LittleMuncherGameInstance,
    LittleMuncherUserInfo
  >;
}

describe("GameContainerComponent", () => {
  let component: GameContainerComponent;
  let fixture: ComponentFixture<GameContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
