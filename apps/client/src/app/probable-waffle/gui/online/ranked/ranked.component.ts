import { Component } from '@angular/core';
import { FactionDefinitions } from '../../../game/player/faction-definitions';
import { Maps } from '../../../game/world/scenes/scenes';

@Component({
  selector: 'fuzzy-waddle-ranked',
  templateUrl: './ranked.component.html',
  styleUrls: ['./ranked.component.scss']
})
export class RankedComponent {
  FactionDefinitions = FactionDefinitions;
  Maps = Maps;
  searching = false;
  rankedOptions = {
    factionType: undefined
  };

  start() {
    this.searching = true;
    // todo
  }
}
