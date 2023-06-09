import { Component, OnInit } from '@angular/core';
import { SpectateService } from './spectate.service';
import { Room } from '@fuzzy-waddle/api-interfaces';
import { ServerHealthService } from '../../../shared/services/server-health.service';

@Component({
  selector: 'little-muncher-spectate',
  templateUrl: './spectate.component.html',
  styleUrls: ['./spectate.component.scss']
})
export class SpectateComponent implements OnInit {
  constructor(
    protected readonly spectateService: SpectateService,
    protected readonly serverHealthService: ServerHealthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.spectateService.initiallyPullRooms();
  }

  async spectate(room: Room) {
    await this.spectateService.joinRoom(room.gameInstanceId);
  }
}
