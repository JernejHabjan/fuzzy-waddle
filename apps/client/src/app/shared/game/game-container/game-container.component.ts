import { Component, inject, Input, NgZone, type OnDestroy, type OnInit, ViewChild } from "@angular/core";
import { BaseGame } from "../phaser/game/base-game";
import type { Types } from "phaser";
import { type BaseGameData } from "../phaser/game/base-game-data";
import { GameContainerElement } from "./game-container";
import { AngularHost } from "../../consts";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "fuzzy-waddle-game-container",
  templateUrl: "./game-container.component.html",
  styleUrls: ["./game-container.component.scss"],
  standalone: true,
  host: AngularHost.contentFlexFullHeight
})
export class GameContainerComponent implements OnInit, OnDestroy {
  protected readonly GameContainerElement = GameContainerElement;

  @Input({ required: true }) gameConfig!: Types.Core.GameConfig;
  @Input({ required: true }) gameData!: BaseGameData<any, any, any>;

  private gameRef?: BaseGame;

  private readonly ngZone = inject(NgZone);

  private _gameContainerElement!: HTMLDivElement;

  async ngOnInit(): Promise<void> {
    if (environment.production) {
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
      this.gameRef = new BaseGame(this.gameConfig, this.gameData);
    });
  }

  ngOnDestroy(): void {
    this.gameRef?.destroy(true);
    this.gameRef = undefined;
  }
}
