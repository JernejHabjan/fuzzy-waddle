import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameInstanceService } from '../../communicators/game-instance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'fuzzy-waddle-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  constructor(public gameInstanceService: GameInstanceService, private router: Router) {}

  leaveClick() {
    this.router.navigate(['/probable-waffle']);
  }
}
