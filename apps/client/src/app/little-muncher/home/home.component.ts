import { Component, EventEmitter, Output } from '@angular/core';
import { LittleMuncherHills } from '@fuzzy-waddle/api-interfaces';
import { ServerHealthService } from '../../shared/services/server-health.service';

@Component({
  selector: 'little-muncher-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  LittleMuncherHills = LittleMuncherHills;
  @Output() runGame: EventEmitter<LittleMuncherHills> = new EventEmitter<LittleMuncherHills>();

  constructor(protected readonly serverHealthService: ServerHealthService) {}
  climbOn(hillName: LittleMuncherHills) {
    this.runGame.next(hillName);
  }
}
