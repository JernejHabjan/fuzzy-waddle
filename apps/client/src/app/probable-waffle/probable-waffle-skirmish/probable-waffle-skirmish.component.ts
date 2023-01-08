import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo, Maps } from '../probable-waffle-game/scenes/scenes';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-skirmish',
  templateUrl: './probable-waffle-skirmish.component.html',
  styleUrls: ['./probable-waffle-skirmish.component.scss']
})
export class ProbableWaffleSkirmishComponent {
  Maps =Maps;
  configured = false;
  dropdownVisible = false;
  selectedMap?: MapInfo;
  constructor(private router: Router) {}

  start() {
    this.router.navigate(['probable-waffle/game']);
  }

  leaveClick() {
    this.router.navigate(['probable-waffle']);
  }
}
