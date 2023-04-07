import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'fuzzy-waddle-profile-nav',
  templateUrl: './profile-nav.component.html',
  styleUrls: ['./profile-nav.component.scss']
})
export class ProfileNavComponent {
  constructor(private router: Router, protected authService: AuthService) {}

  async toHome() {
    await this.router.navigate(['/']);
  }

  async signOut() {
    await this.authService.signOut();
    await this.toHome();
  }
}
