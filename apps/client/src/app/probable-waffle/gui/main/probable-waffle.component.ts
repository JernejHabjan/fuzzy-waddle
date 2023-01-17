import { Component } from '@angular/core';
import { GameInstanceService } from '../../game-instance.service';

@Component({
  selector: 'fuzzy-waddle-probable-waffle',
  templateUrl: './probable-waffle.component.html',
  styleUrls: ['./probable-waffle.component.scss']
})
export class ProbableWaffleComponent {
  constructor(private gameInstanceService: GameInstanceService) {}
}
