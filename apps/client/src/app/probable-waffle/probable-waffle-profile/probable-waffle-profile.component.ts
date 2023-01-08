import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameInstanceService } from '../game-instance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-profile',
  templateUrl: './probable-waffle-profile.component.html',
  styleUrls: ['./probable-waffle-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProbableWaffleProfileComponent {
  constructor(public gameInstanceService: GameInstanceService, private router: Router) {}

  leaveClick() {
    this.router.navigate(['/probable-waffle']);
  }
}
