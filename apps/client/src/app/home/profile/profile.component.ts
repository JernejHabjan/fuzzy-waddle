import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserInstanceService } from './user-instance.service';

@Component({
  selector: 'fuzzy-waddle-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  constructor(private router: Router, public authService: AuthService, public userInstanceService: UserInstanceService) {}

  async toHome() {
    await this.router.navigate(['/']);
  }

  async signOut() {
    await this.authService.signOut();
    await this.toHome();
  }
}
