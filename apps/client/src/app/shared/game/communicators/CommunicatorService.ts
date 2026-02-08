import { Socket } from "ngx-socket-io";
import type { GameInstanceId } from "@fuzzy-waddle/api-interfaces";

export interface CommunicatorService {
  startCommunication(gameInstanceId: GameInstanceId, socket?: Socket): void;
  stopCommunication(gameInstanceId: GameInstanceId, socket?: Socket): void;
}
