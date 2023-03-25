import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SceneCommunicatorService } from '../../../communicators/scene-communicator.service';
import { GameContainerElement, probableWaffleGameConfig } from '../../../game/world/const/game-config';
import { Game } from 'phaser';

@Component({
  selector: 'fuzzy-waddle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  GameContainerElement = GameContainerElement;
  gameRef!: Game;
  drawerWidth = '150px';
  displayDrawers = true; // todo

  constructor(private ngZone: NgZone) {}

  private _gameContainerElement!: HTMLDivElement;

  @ViewChild('gameContainerElement')
  get gameContainerElement(): HTMLDivElement {
    return this._gameContainerElement;
  }

  set gameContainerElement(value: HTMLDivElement) {
    this._gameContainerElement = value;
    this.setupGameContainer();
  }

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
      this.gameRef = new Game(probableWaffleGameConfig);
    });
  }
}
