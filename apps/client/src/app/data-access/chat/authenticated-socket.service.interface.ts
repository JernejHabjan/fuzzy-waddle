import { Socket } from 'ngx-socket-io';

export interface IAuthenticatedSocketService {
  get socket(): Socket | undefined;
}
