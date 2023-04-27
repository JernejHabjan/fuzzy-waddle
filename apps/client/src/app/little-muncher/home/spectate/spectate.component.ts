import { Component, OnDestroy, OnInit } from '@angular/core';
import { SpectateService } from './spectate.service';
import { Subscription } from 'rxjs';
import { Room } from '@fuzzy-waddle/api-interfaces';
import { ServerHealthService } from '../../../shared/services/server-health.service';

@Component({
  selector: 'little-muncher-spectate',
  templateUrl: './spectate.component.html',
  styleUrls: ['./spectate.component.scss']
})
export class SpectateComponent implements OnInit, OnDestroy {
  private spectateRoomsSubscription!: Subscription;
  protected rooms: Room[] = [];

  constructor(
    private readonly spectateService: SpectateService,
    protected readonly serverHealthService: ServerHealthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.rooms = await this.spectateService.getRooms();
    this.spectateRoomsSubscription = this.spectateService.roomEvent.subscribe((roomEvent) => {
      const room = roomEvent.room;
      if (roomEvent.action === 'added') {
        this.rooms.push(room);
      } else if (roomEvent.action === 'removed') {
        this.rooms = this.rooms.filter((room) => room.gameInstanceId !== room.gameInstanceId);
      }
    });
  }

  ngOnDestroy(): void {
    this.spectateRoomsSubscription.unsubscribe();
  }

  async spectate(room: Room) {
    await this.spectateService.joinRoom(room.gameInstanceId);
  }
}
