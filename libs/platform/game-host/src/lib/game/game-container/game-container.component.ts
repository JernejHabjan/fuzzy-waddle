import { Component, inject, isDevMode, NgZone, type OnDestroy, type OnInit, ViewChild, input } from "@angular/core";
import { BaseGame } from "../phaser/game/base-game";
import type { Types } from "phaser";
import { type BaseGameData } from "../phaser/game/base-game-data";
import { GameContainerElement } from "./game-container";

@Component({
  selector: "fuzzy-waddle-game-container",
  templateUrl: "./game-container.component.html",
  styleUrls: ["./game-container.component.scss"],
  standalone: true,
  host: { class: "d-flex flex-column h-100" }
})
export class GameContainerComponent implements OnInit, OnDestroy {
  protected readonly GameContainerElement = GameContainerElement;

  readonly gameConfig = input.required<Types.Core.GameConfig>();
  readonly gameData = input.required<BaseGameData<any, any, any>>();

  private gameRef?: BaseGame;

  private readonly ngZone = inject(NgZone);

  private _gameContainerElement!: HTMLDivElement;

  async ngOnInit(): Promise<void> {
    if (!isDevMode()) {
      await document.documentElement.requestFullscreen();
    }
  }

  @ViewChild("gameContainerElement")
  get gameContainerElement(): HTMLDivElement {
    return this._gameContainerElement;
  }

  // noinspection JSUnusedGlobalSymbols
  set gameContainerElement(value: HTMLDivElement) {
    this._gameContainerElement = value;
    // noinspection JSIgnoredPromiseFromCall
    this.setupGameContainer();
  }

  private async setupGameContainer() {
    await this.ngZone.runOutsideAngular(async () => {
      this.gameRef = new BaseGame(this.gameConfig(), this.gameData());
    });
  }

  ngOnDestroy(): void {
    this.gameRef?.destroy(true);
    this.gameRef = undefined;
  }
}
