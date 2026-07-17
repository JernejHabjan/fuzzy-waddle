import { Observable, Subject } from "rxjs";
import { type LittleMuncherRoomEvent } from "@fuzzy-waddle/api-interfaces";
import { type SpectateServiceInterface } from "./spectate.service.interface";

export const spectateServiceStub = {
  rooms: [],
  spectatorDisconnected: new Subject<void>(),
  listenToRoomEvents(): Promise<void> {
    return Promise.resolve();
  },
  destroy() {
    //
  },
  async getRoomEvent(): Promise<Observable<LittleMuncherRoomEvent> | undefined> {
    return undefined;
  },
  getRooms() {
    return Promise.resolve([]);
  },
  initiallyPullRooms(): Promise<void> {
    return Promise.resolve();
  },
  joinRoom() {
    //
  },
  leaveRoom() {
    //
  }
} satisfies SpectateServiceInterface;
