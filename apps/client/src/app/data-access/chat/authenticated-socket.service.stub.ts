import { Socket } from "ngx-socket-io";
import { IAuthenticatedSocketService } from "./authenticated-socket.service.interface";

export const createAuthenticatedSocketServiceStub = {
  async getSocket(): Promise<Socket | undefined> {
    return undefined;
  }
} satisfies IAuthenticatedSocketService;
