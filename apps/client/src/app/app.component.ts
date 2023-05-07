import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { ServerHealthService } from './shared/services/server-health.service';

@Component({
  selector: 'fuzzy-waddle-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(protected readonly authService: AuthService, private readonly serverHealthService: ServerHealthService) {}

  async ngOnInit() {
    await Promise.all([this.serverHealthService.checkHealth(), this.authService.autoSignIn()]);
  }
}
