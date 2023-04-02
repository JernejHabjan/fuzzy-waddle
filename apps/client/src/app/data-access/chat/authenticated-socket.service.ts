import { Socket } from 'ngx-socket-io';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { IAuthenticatedSocketService } from './authenticated-socket.service.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedSocketService implements IAuthenticatedSocketService {
  constructor(private readonly authService: AuthService) {}

  createAuthSocket() {
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
