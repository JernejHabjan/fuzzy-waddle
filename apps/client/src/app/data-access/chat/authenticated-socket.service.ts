import { Socket } from "ngx-socket-io";
import { AuthService } from "../../auth/auth.service";
import { environment } from "../../../environments/environment";
import { Injectable, inject } from "@angular/core";
import { IAuthenticatedSocketService } from "./authenticated-socket.service.interface";

@Injectable({
  providedIn: "root"
})
export class AuthenticatedSocketService implements IAuthenticatedSocketService {
  private readonly authService = inject(AuthService);

  private authenticatedSocket?: Socket;

  get socket(): Socket | undefined {
    if (!this.authenticatedSocket && this.authService.isAuthenticated) {
      this.authenticatedSocket = this.createAuthSocket();
    }

    return this.authenticatedSocket;
  }

  private createAuthSocket() {
    return new Socket({
      ...environment.socketIoConfig,
      options: {
        auth: {
          token: this.authService.accessToken
        }
      }
    });
  }
}
