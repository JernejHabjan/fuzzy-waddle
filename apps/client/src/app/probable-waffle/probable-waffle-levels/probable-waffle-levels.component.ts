import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-levels',
  templateUrl: './probable-waffle-levels.component.html',
  styleUrls: ['./probable-waffle-levels.component.scss']
})
export class ProbableWaffleLevelsComponent {
  constructor(private router: Router) {}
  leave() {
    this.router.navigate(['probable-waffle']);
  }

  game1() {
    this.router.navigate(['probable-waffle/game']);
  }
}
