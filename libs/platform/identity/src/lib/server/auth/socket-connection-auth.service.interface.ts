import { type Socket } from "socket.io";

export interface SocketConnectionAuthServiceInterface {
  authenticateSocket(client: Socket): Promise<boolean>;
  disconnectUnauthenticatedClient(client: Socket): Promise<void>;
}
