import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import { SceneCommunicatorService } from '../../../communicators/scene-communicator.service';
import { GameContainerElement, probableWaffleGameConfig } from '../../../game/world/const/game-config';

@Component({
  selector: 'fuzzy-waddle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  @ViewChild('gameContainerElement')
  get gameContainerElement(): HTMLDivElement {
    return this._gameContainerElement;
  }

  set gameContainerElement(value: HTMLDivElement) {
    this._gameContainerElement = value;
    this.setupGameContainer();
  }
  private _gameContainerElement!: HTMLDivElement;
  GameContainerElement = GameContainerElement;
  gameRef!: Phaser.Game;
  drawerWidth = '150px';
  displayDrawers = true; // todo
  constructor(private ngZone: NgZone) {}
  ngOnDestroy(): void {
    this.gameRef.destroy(true);
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();

    if (window.innerWidth < 800) {
      this.displayDrawers = false; // todo for now
    }
  }

  private setupGameContainer() {
    this.ngZone.runOutsideAngular(() => {
      this.gameRef = new Phaser.Game(probableWaffleGameConfig);
    });
  }
}
