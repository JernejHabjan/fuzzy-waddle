import { Component, OnDestroy, OnInit } from '@angular/core';
import { SpectateService } from './spectate.service';
import { Subscription } from 'rxjs';
import { SpectatorRoom } from '@fuzzy-waddle/api-interfaces';
import { ServerHealthService } from '../../../shared/services/server-health.service';

@Component({
  selector: 'little-muncher-spectate',
  templateUrl: './spectate.component.html',
  styleUrls: ['./spectate.component.scss']
})
export class SpectateComponent implements OnInit, OnDestroy {
  private spectateRoomsSubscription!: Subscription;
  protected rooms: SpectatorRoom[] = [];

  constructor(
    private readonly spectateService: SpectateService,
    protected readonly serverHealthService: ServerHealthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.rooms = await this.spectateService.getSpectatorRooms();
    this.spectateRoomsSubscription = this.spectateService.spectatorRoomEvent.subscribe((spectatorRoom) => {
      if (spectatorRoom.action === 'added') {
        this.rooms.push(spectatorRoom);
      } else if (spectatorRoom.action === 'removed') {
        this.rooms = this.rooms.filter((room) => room.id !== spectatorRoom.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.spectateRoomsSubscription.unsubscribe();
  }

  spectate(room: SpectatorRoom) {
    // todo
  }
}
