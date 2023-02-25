import { Component } from '@angular/core';
import { GameInstanceService } from '../../communicators/game-instance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'fuzzy-waddle-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private gameInstanceService: GameInstanceService, private router: Router) {}

  progressClick() {
    // navigate to profile
    this.router.navigate(['probable-waffle/progress']);
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
