import { Socket } from "ngx-socket-io";
import { AuthService } from "../../auth/auth.service";
import { environment } from "../../../environments/environment";
import { inject, Injectable } from "@angular/core";
import { IAuthenticatedSocketService } from "./authenticated-socket.service.interface";
import { ServerHealthService } from "../../shared/services/server-health.service";

@Injectable({
  providedIn: "root"
})
export class AuthenticatedSocketService implements IAuthenticatedSocketService {
  private readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);

  private authenticatedSocket?: Socket;

  async getSocket(): Promise<Socket | undefined> {
    await this.serverHealthService.checkHealth();
    if (!this.authenticatedSocket && this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      try {
        this.authenticatedSocket = await this.createAuthSocket();
      } catch (error) {
        console.error("Failed to create authenticated socket", error);
      }
    }

    return this.authenticatedSocket;
  }

  private createAuthSocket(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = new Socket({
        ...environment.socketIoConfig,
        options: {
          auth: {
            token: this.authService.accessToken
          }
        }
      });

      socket.connect();
      socket.on("connect", () => resolve(socket));
      socket.on("connect_error", (err: any) => reject(err));
    });
  }
}
