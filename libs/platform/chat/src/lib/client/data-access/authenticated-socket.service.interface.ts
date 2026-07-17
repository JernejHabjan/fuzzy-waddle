import { Socket } from "ngx-socket-io";

export interface IAuthenticatedSocketService {
  getSocket(): Promise<Socket | undefined>;
}
