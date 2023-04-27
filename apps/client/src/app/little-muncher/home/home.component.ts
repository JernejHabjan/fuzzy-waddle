import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LittleMuncherGameCreate,
  LittleMuncherGameSessionInstance,
  LittleMuncherHills
} from '@fuzzy-waddle/api-interfaces';
import { ServerHealthService } from '../../shared/services/server-health.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'little-muncher-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  LittleMuncherHills = LittleMuncherHills;
  @Input() gameSessionInstance!: LittleMuncherGameSessionInstance;
  @Output() runGame: EventEmitter<LittleMuncherGameCreate> = new EventEmitter<LittleMuncherGameCreate>();

  constructor(
    protected readonly serverHealthService: ServerHealthService,
    protected readonly authService: AuthService
  ) {}

  climbOn(hillName: LittleMuncherHills) {
    this.runGame.next({
      level: {
        hillName
      },
      player_ids: [this.authService.userId as string]
    });
  }
}
