import { OnDestroy } from "@angular/core";
import { Socket } from "ngx-socket-io";

export interface CommunicatorService {
  startCommunication(gameInstanceId: string, socket?: Socket): void;
  stopCommunication(gameInstanceId: string, socket: Socket): void;
}
