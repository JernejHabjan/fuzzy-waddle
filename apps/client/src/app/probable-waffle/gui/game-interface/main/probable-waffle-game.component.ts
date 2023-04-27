import { Component, OnDestroy, OnInit } from '@angular/core';
import { SceneCommunicatorService } from '../../../communicators/scene-communicator.service';
import { probableWaffleGameConfig } from '../../../game/world/const/game-config';

@Component({
  selector: 'fuzzy-waddle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  protected readonly probableWaffleGameConfig = probableWaffleGameConfig;
  drawerWidth = '150px';
  displayDrawers = true; // todo
  gameData = {}; // todo later add communicator here

  ngOnDestroy(): void {
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();

    if (window.innerWidth < 800) {
      this.displayDrawers = false; // todo for now
    }
  }
}
