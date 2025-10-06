import type { SocketIoConfig } from "ngx-socket-io";

export type Environment = {
  production: boolean;
  api: string;

  supabase: {
    url: string;
    key: string;
  };
  socketIoConfig: SocketIoConfig;
};
