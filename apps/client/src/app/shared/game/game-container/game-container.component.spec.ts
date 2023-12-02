import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GameContainerComponent } from "./game-container.component";
import { Component, Input } from "@angular/core";
import { BaseGameData } from "../phaser/game/base-game-data";
import { LittleMuncherCommunicatorService } from "../../../little-muncher/game/little-muncher-communicator.service";
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";

jest.mock("phaser", () => {
  return {
    Game: class Game {
      constructor() {
        //
      }

      destroy() {
        //
      }
    }
  };
});

@Component({ selector: "fuzzy-waddle-game-container", template: "" })
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
      declarations: [GameContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
