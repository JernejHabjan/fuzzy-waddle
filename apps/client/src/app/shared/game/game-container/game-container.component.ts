import { Component, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { BaseGame } from '../phaser/game/base-game';
import { Types } from 'phaser';
import { BaseGameData } from '../phaser/game/base-game-data';
import { GameContainerElement } from './game-container';
import { CommunicatorService } from '../../../little-muncher/game/communicator.service';
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'fuzzy-waddle-game-container',
  templateUrl: './game-container.component.html',
  styleUrls: ['./game-container.component.scss']
})
export class GameContainerComponent implements OnDestroy {
  protected readonly GameContainerElement = GameContainerElement;

  @Input({ required: true }) gameConfig!: Types.Core.GameConfig;
  @Input({ required: true }) gameData!: BaseGameData<
    CommunicatorService,
    LittleMuncherGameInstance,
    LittleMuncherUserInfo
  >;

  private gameRef?: BaseGame;

  constructor(private readonly ngZone: NgZone) {}

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
      this.gameRef = new BaseGame(this.gameConfig, this.gameData);
    });
  }

  ngOnDestroy(): void {
    this.gameRef?.destroy(true);
    this.gameRef = undefined;
  }
}
