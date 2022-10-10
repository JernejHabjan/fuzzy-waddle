import { Component, OnDestroy, OnInit } from '@angular/core';
import * as Phaser from 'phaser';
import { SceneCommunicatorService } from './event-emitters/scene-communicator.service';
import { probableWaffleGameConfig } from './const/game-config';
import { animate, AUTO_STYLE, state, style, transition, trigger } from '@angular/animations';

const DEFAULT_DURATION = 300;
@Component({
  selector: 'fuzzy-waddle-probable-waffle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss'],
  animations: [
    trigger('collapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out'))
    ])
  ]
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  gameRef!: Phaser.Game;
  collapsedEditor = false;
  collapsedSelectionBar = false;

  ngOnDestroy(): void {
    this.gameRef.destroy(true);
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();

    this.gameRef = new Phaser.Game(probableWaffleGameConfig);
  }
}
