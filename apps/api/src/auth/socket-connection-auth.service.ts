import { Injectable } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { Socket } from "socket.io";
import { UserProfilesService } from "../app/user-profiles/user-profiles.service";
import { SupabaseProviderService } from "../core/supabase-provider/supabase-provider.service";
import { type SocketConnectionAuthServiceInterface } from "./socket-connection-auth.service.interface";

@Injectable()
export class SocketConnectionAuthService implements SocketConnectionAuthServiceInterface {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly userProfilesService: UserProfilesService
  ) {}

  /**
   * Gateways use this helper so connection-time auth stays consistent with the
   * request guards: the socket must carry a valid Supabase user and that user
   * must still have online access.
   */
  async authenticateSocket(client: Socket): Promise<boolean> {
    const accessToken = this.getAccessToken(client);
    if (!accessToken) {
      return false;
    }

    try {
      const { data, error } = await this.supabaseProviderService.supabaseClient.auth.getUser(accessToken);
      if (error || !data.user) {
        return false;
      }

      await this.userProfilesService.ensureOnlineAccess(data.user.id);
      (client as Socket & { user?: AuthUser }).user = data.user;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Shared connection hook for gateways that should reject passive listeners
   * before they can subscribe to any server-pushed events.
   */
  async disconnectUnauthenticatedClient(client: Socket): Promise<void> {
    const authenticated = await this.authenticateSocket(client);
    if (!authenticated) {
      client.disconnect(true);
    }
  }

  private getAccessToken(client: Socket): string | null {
    const handshakeToken = client.handshake.auth?.token;
    if (typeof handshakeToken === "string" && handshakeToken.length > 0) {
      return handshakeToken;
    }

    const queryToken = client.handshake.query.access_token;
    if (typeof queryToken === "string" && queryToken.length > 0) {
      return queryToken;
    }

    return null;
  }
}
