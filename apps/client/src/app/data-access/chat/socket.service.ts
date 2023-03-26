import { Socket } from 'ngx-socket-io';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

export class AuthenticatedSocket extends Socket {
  constructor(authService: AuthService) {
    super({
      ...environment.socketIoConfig,
      options: {
        auth: {
          token: authService.accessToken
        }
      }
    });
  }
}
