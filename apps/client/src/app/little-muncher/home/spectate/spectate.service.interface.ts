import { Room, RoomEvent } from '@fuzzy-waddle/api-interfaces';
import { Observable, Subject } from 'rxjs';

export interface SpectateServiceInterface {
  rooms: Room[];
  spectatorDisconnected: Subject<void>;

  listenToRoomEvents(): void;

  getRooms(): Promise<Room[]>;

  initiallyPullRooms(): Promise<void>;

  get roomEvent(): Observable<RoomEvent> | undefined;

  joinRoom(gameInstanceId: string): void;

  leaveRoom(gameInstanceId: string): void;

  destroy(): void;
}
