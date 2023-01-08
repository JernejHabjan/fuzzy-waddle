import { Component } from '@angular/core';
import { GameInstanceService } from '../game-instance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-home',
  templateUrl: './probable-waffle-home.component.html',
  styleUrls: ['./probable-waffle-home.component.scss']
})
export class ProbableWaffleHomeComponent {
  constructor(private gameInstanceService: GameInstanceService, private router: Router) {}

  profileClick() {
    // navigate to profile
    this.router.navigate(['probable-waffle/profile']);
  }

  skirmishClick() {
    // navigate to skirmish
    this.router.navigate(['probable-waffle/skirmish']);
  }

  editorClick() {
    // todo
  }

  playgroundClick() {
    this.router.navigate(['probable-waffle/playground']);
  }

  leaveClick() {
    this.router.navigate(['']);
  }
}
