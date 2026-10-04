import type { Socket } from "ngx-socket-io";

export type NgxSocketIoConnectHandler = () => void;
export type NgxSocketIoDisconnectHandler = (reason: string) => void;

export interface NgxSocketIoRawSocket {
  readonly id?: string;
  readonly connected?: boolean;
  on(event: "connect", handler: NgxSocketIoConnectHandler): void;
  on(event: "disconnect", handler: NgxSocketIoDisconnectHandler): void;
  off?(event: "connect", handler: NgxSocketIoConnectHandler): void;
  off?(event: "disconnect", handler: NgxSocketIoDisconnectHandler): void;
  removeListener?(event: "connect", handler: NgxSocketIoConnectHandler): void;
  removeListener?(event: "disconnect", handler: NgxSocketIoDisconnectHandler): void;
}

type SocketWithIoSocket = Socket & {
  readonly ioSocket?: NgxSocketIoRawSocket;
};

/**
 * ngx-socket-io exposes the native Socket.IO client as `ioSocket`, but its public
 * type does not include that property. Keep the library-shape assertion here so
 * reconnect and room-membership code can stay typed at their call sites.
 */
export function getNgxSocketIoRawSocket(socket: Socket | null | undefined): NgxSocketIoRawSocket | undefined {
  return (socket as SocketWithIoSocket | null | undefined)?.ioSocket;
}
