import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameInstanceService } from '../../communicators/game-instance.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent {
  constructor(public gameInstanceService: GameInstanceService, private router: Router) {}

  leaveClick() {
    this.router.navigate(['/probable-waffle']);
  }
}
