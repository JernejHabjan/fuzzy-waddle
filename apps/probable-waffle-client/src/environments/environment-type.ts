import type { SocketIoConfig } from "ngx-socket-io";

export type Environment = {
  production: boolean;
  /** Whether the app is running as a Tauri desktop app */
  isDesktop: boolean;
  api: string;

  supabase: {
    url: string;
    key: string;
  };
  socketIoConfig: SocketIoConfig;
  version: string;
};
