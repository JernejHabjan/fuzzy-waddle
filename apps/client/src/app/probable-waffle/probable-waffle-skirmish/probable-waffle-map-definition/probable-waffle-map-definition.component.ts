import { Component, Input } from '@angular/core';
import { MapInfo } from '../../probable-waffle-game/scenes/scenes';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-map-definition',
  templateUrl: './probable-waffle-map-definition.component.html',
  styleUrls: ['./probable-waffle-map-definition.component.scss']
})
export class ProbableWaffleMapDefinitionComponent {
  @Input() map?: MapInfo;

}
