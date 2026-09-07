import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { AuthUser } from "@supabase/supabase-js";
import { FriendRelationshipStatus } from "@fuzzy-waddle/platform-database-schema";
import { SocketConnectionAuthService } from "../auth/socket-connection-auth.service";
import { GatewayPresenceEvent, type PresenceChangedEvent, type PresenceSnapshot } from "../../social/presence";
import type { SocialUserId } from "../../social/social-identifiers";
import { asSocialUserId } from "../../social/social-identifiers";
import { PresenceService } from "./presence.service";
import { SocialService } from "./social.service";

/** Room every authenticated socket for a given user joins so presence/party events can target them. */
export const userPresenceRoom = (userId: SocialUserId): string => `user:${userId}`;

/**
 * Derives online/offline presence purely from authenticated socket connection counts and publishes
 * it only to the connecting user (snapshot) and their accepted friends (deltas). Clients cannot set
 * presence directly; unauthorized users never receive a presence event for someone they aren't
 * friends with.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly socketConnectionAuthService: SocketConnectionAuthService,
    private readonly presenceService: PresenceService,
    private readonly socialService: SocialService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const authenticated = await this.socketConnectionAuthService.authenticateSocket(client);
    if (!authenticated) {
      client.disconnect(true);
      return;
    }

    const user = (client as Socket & { user: AuthUser }).user;
    const userId = asSocialUserId(user.id);
    await client.join(userPresenceRoom(userId));

    const friendIds = await this.friendIds(user);
    const snapshot: PresenceSnapshot = {
      friends: Object.fromEntries(
        friendIds.map((id) => [id, this.presenceService.getState(id)])
      ) as PresenceSnapshot["friends"]
    };
    client.emit(GatewayPresenceEvent.PresenceSnapshot, snapshot);

    const becameOnline = this.presenceService.registerConnection(userId);
    if (becameOnline) {
      this.broadcastPresence(userId, friendIds, "online");
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = (client as Socket & { user?: AuthUser }).user;
    if (!user) return;
    const userId = asSocialUserId(user.id);
    const friendIds = await this.friendIds(user);

    this.presenceService.deregisterConnection(userId, (offlineUserId) => {
      this.broadcastPresence(offlineUserId, friendIds, "offline");
    });
  }

  private async friendIds(user: AuthUser): Promise<SocialUserId[]> {
    const snapshot = await this.socialService.getSnapshot(user);
    return snapshot.relationships
      .filter((relationship) => relationship.status === FriendRelationshipStatus.Accepted)
      .map((relationship) => relationship.user.id);
  }

  private broadcastPresence(
    userId: SocialUserId,
    friendIds: readonly SocialUserId[],
    state: "online" | "offline"
  ): void {
    const event: PresenceChangedEvent = { userId, state };
    for (const friendId of friendIds) {
      this.server.to(userPresenceRoom(friendId)).emit(GatewayPresenceEvent.PresenceChanged, event);
    }
  }
}
