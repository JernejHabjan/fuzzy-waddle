import { type Socket } from "socket.io";
import { type SocketConnectionAuthServiceInterface } from "./socket-connection-auth.service.interface";

export const socketConnectionAuthServiceStub = {
  authenticateSocket(client: Socket): Promise<boolean> {
    return Promise.resolve(true);
  },
  disconnectUnauthenticatedClient(client: Socket): Promise<void> {
    return Promise.resolve();
  }
} satisfies SocketConnectionAuthServiceInterface;
