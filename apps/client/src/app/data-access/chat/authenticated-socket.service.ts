import { Socket } from "ngx-socket-io";
import { AuthService } from "../../auth/auth.service";
import { environment } from "../../../environments/environment";
import { ApplicationRef, inject, Injectable } from "@angular/core";
import { type IAuthenticatedSocketService } from "./authenticated-socket.service.interface";
import { ServerHealthService } from "../../shared/services/server-health.service";

@Injectable({
  providedIn: "root"
})
export class AuthenticatedSocketService implements IAuthenticatedSocketService {
  private readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly appRef = inject(ApplicationRef);
  private authenticatedSocket?: Socket;
  private socketPromise?: Promise<Socket>;

  async getSocket(): Promise<Socket | undefined> {
    await this.serverHealthService.checkHealth();
    if (this.authenticatedSocket) {
      const rawSocket = (this.authenticatedSocket as any).ioSocket;
      if (
        this.authService.isAuthenticated &&
        this.serverHealthService.serverAvailable &&
        rawSocket &&
        rawSocket.disconnected
      ) {
        console.info("[Socket] Reconnecting existing authenticated socket.");
        this.authenticatedSocket.connect();
      }
      return this.authenticatedSocket;
    }

    if (!this.authenticatedSocket && this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      try {
        this.socketPromise ??= this.createAuthSocket();
        this.authenticatedSocket = await this.socketPromise;
      } catch (error) {
        console.error("Failed to create authenticated socket", error);
      } finally {
        this.socketPromise = undefined;
      }
    }

    return this.authenticatedSocket;
  }

  private createAuthSocket(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = new Socket({ ...environment.socketIoConfig }, this.appRef);
      socket.auth = { token: this.authService.accessToken };
      socket.on("disconnect", (reason: string) => {
        console.warn(`[Socket] Authenticated socket disconnected. reason=${reason}`);
      });
      socket.connect();
      socket.on("connect", () => {
        const socketId = (socket as any).ioSocket?.id ?? "unknown";
        console.info(`[Socket] Authenticated socket connected. socketId=${socketId}`);
        resolve(socket);
      });
      socket.on("connect_error", (err: any) => reject(err));
    });
  }
}
