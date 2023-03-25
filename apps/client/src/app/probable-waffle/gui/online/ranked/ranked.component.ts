import { Component } from '@angular/core';
import { RaceDefinitions } from '../../../game/player/race-definitions';
import { Maps } from '../../../game/world/scenes/scenes';

@Component({
  selector: 'fuzzy-waddle-ranked',
  templateUrl: './ranked.component.html',
  styleUrls: ['./ranked.component.scss']
})
export class RankedComponent {
  RaceDefinitions = RaceDefinitions;
  Maps = Maps;
  searching = false;
  rankedOptions = {
    raceType: undefined
  };

  start() {
    this.searching = true;
    // todo
  }
}
