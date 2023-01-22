import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import * as Phaser from 'phaser';
import { SceneCommunicatorService } from '../../../communicators/scene-communicator.service';
import { probableWaffleGameConfig } from '../../../game/world/const/game-config';

@Component({
  selector: 'fuzzy-waddle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  gameRef!: Phaser.Game;
  drawerWidth = '100px';
  displayDrawers = true; // todo
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

    if(window.innerWidth < 800) {
      this.displayDrawers = false; // todo for now
    }
  }
}
