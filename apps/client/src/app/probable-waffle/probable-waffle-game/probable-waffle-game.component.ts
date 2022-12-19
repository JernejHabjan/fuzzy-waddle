import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import * as Phaser from 'phaser';
import { SceneCommunicatorService } from './event-emitters/scene-communicator.service';
import { probableWaffleGameConfig } from './const/game-config';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  gameRef!: Phaser.Game;
  drawerWidth = '100px';
  displayDrawers = false; // todo
  constructor(private ngZone: NgZone) {}
  ngOnDestroy(): void {
    this.gameRef.destroy(true);
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();

    this.ngZone.runOutsideAngular(() => {
      this.gameRef = new Phaser.Game(probableWaffleGameConfig);
    });
  }
}
