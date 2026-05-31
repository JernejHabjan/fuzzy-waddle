import type { SocketIoConfig } from "ngx-socket-io";

export type Environment = {
  /**
   * Enables production-only behavior such as hiding dev-only routes and debug UI.
   */
  production: boolean;

  /**
   * Base URL for the NestJS API. Include the trailing slash because services append paths like `api/health`.
   * Local default: http://localhost:3333/
   */
  api: string;

  /**
   * Public browser URL for this Angular app.
   * Supabase OAuth uses this as the post-login redirect target, so it must exactly match
   * `site_url` or `additional_redirect_urls` in `supabase/config.toml` for local auth.
   */
  clientUrl: string;

  supabase: {
    /**
     * Supabase project URL.
     * Hosted: Supabase Dashboard > Project Settings > Data API/API > Project URL.
     * Local: `supabase status` > API URL, usually http://127.0.0.1:54321.
     */
    url: string;

    /**
     * Public anon/publishable key for browser access.
     * Hosted: Supabase Dashboard > Project Settings > API keys > anon/public or publishable key.
     * Local: `supabase status` > Authentication Keys > Publishable.
     * Do not use the service role/secret key here.
     */
    key: string;
  };

  /**
   * Socket.IO endpoint for real-time game and chat gateways.
   * Usually the same host as `api`, without the trailing slash.
   */
  socketIoConfig: SocketIoConfig;

  /**
   * App version shown in the client, sourced from the root package.json.
   */
  version: string;
};
