import { Injectable } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { Socket } from "socket.io";
import { UserProfilesService } from "../app/user-profiles/user-profiles.service";
import { SupabaseProviderService } from "../core/supabase-provider/supabase-provider.service";

@Injectable()
export class SocketConnectionAuthService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly userProfilesService: UserProfilesService
  ) {}

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
