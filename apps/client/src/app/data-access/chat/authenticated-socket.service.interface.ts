import { Socket } from 'ngx-socket-io';

export interface IAuthenticatedSocketService {
  createAuthSocket(): Socket;
}
