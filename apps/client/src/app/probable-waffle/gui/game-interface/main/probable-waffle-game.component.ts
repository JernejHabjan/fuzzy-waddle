import { Component, OnDestroy, OnInit } from '@angular/core';
import { SceneCommunicatorService } from '../../../communicators/scene-communicator.service';
import { probableWaffleGameConfig } from '../../../game/world/const/game-config';
import { BaseGameData } from '../../../../shared/game/phaser/game/base-game-data';
import { GameModeBase, GameSessionInstance } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'fuzzy-waddle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  protected readonly probableWaffleGameConfig = probableWaffleGameConfig;
  drawerWidth = '150px';
  displayDrawers = true; // todo
  gameData?: BaseGameData<GameModeBase>; // todo

  ngOnDestroy(): void {
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();
    const gameSessionInstance = new GameSessionInstance();
    this.gameData = {
      gameSessionInstance
      // todo later add communicator here when you rework it from this singleton
    };

    if (window.innerWidth < 800) {
      this.displayDrawers = false; // todo for now
    }
  }
}
