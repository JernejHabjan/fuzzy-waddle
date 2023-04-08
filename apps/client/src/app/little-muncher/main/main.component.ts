import { Component, NgZone, ViewChild } from '@angular/core';
import { Game } from 'phaser';
import { GameContainerElement, littleMuncherGameConfig } from '../game/const/game-config';
import { ReferenceHolder } from '../game/reference-holder';

@Component({
  selector: 'little-muncher-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  GameContainerElement = GameContainerElement;

  constructor(private ngZone: NgZone) {}

  private _gameContainerElement!: HTMLDivElement;

  @ViewChild('gameContainerElement')
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
      ReferenceHolder.gameRef = new Game(littleMuncherGameConfig);
    });
  }
}
