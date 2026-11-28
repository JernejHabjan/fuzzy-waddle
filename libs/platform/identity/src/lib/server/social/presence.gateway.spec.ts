import { FriendRelationshipStatus } from "@fuzzy-waddle/platform-database-schema";
import type { AuthUser } from "@supabase/supabase-js";
import { FriendshipDirection } from "../../social/friendship";
import { asFriendshipId, asSocialUserId } from "../../social/social-identifiers";
import { GatewayPresenceEvent } from "../../social/presence";
import { PresenceGateway, userPresenceRoom } from "./presence.gateway";
import { PresenceService } from "./presence.service";

describe("PresenceGateway", () => {
  const userId = asSocialUserId("11111111-1111-4111-8111-111111111111");
  const friendId = asSocialUserId("22222222-2222-4222-8222-222222222222");
  const authUser = { id: userId } as AuthUser;

  const friendRelationship = {
    id: asFriendshipId("33333333-3333-4333-8333-333333333333"),
    status: FriendRelationshipStatus.Accepted,
    direction: FriendshipDirection.Friend,
    requesterId: userId,
    user: { id: friendId, username: "friend", displayName: "Friend", avatarUrl: null },
    createdAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-08-15T00:00:00Z",
    acceptedAt: "2026-08-15T00:00:00Z"
  };

  const makeClient = (user?: AuthUser) => {
    const join = jest.fn().mockResolvedValue(undefined);
    const emit = jest.fn();
    const disconnect = jest.fn();
    return { join, emit, disconnect, user } as any;
  };

  const makeGateway = () => {
    const authenticateSocket = jest.fn();
    const socketConnectionAuthService = { authenticateSocket } as any;
    const presenceService = new PresenceService();
    const getSnapshot = jest.fn().mockResolvedValue({ relationships: [friendRelationship], blocks: [] });
    const socialService = { getSnapshot } as any;
    const gateway = new PresenceGateway(socketConnectionAuthService, presenceService, socialService);
    const to = jest.fn().mockReturnValue({ emit: jest.fn() });
    (gateway as any).server = { to };
    return { gateway, authenticateSocket, to, presenceService };
  };

  it("disconnects a client that fails authentication", async () => {
    const { gateway, authenticateSocket } = makeGateway();
    authenticateSocket.mockResolvedValue(false);
    const client = makeClient();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it("joins the user's room and emits a friend presence snapshot on connect", async () => {
    const { gateway, authenticateSocket } = makeGateway();
    authenticateSocket.mockResolvedValue(true);
    const client = makeClient(authUser);

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith(userPresenceRoom(userId));
    expect(client.emit).toHaveBeenCalledWith(
      GatewayPresenceEvent.PresenceSnapshot,
      expect.objectContaining({ friends: expect.objectContaining({ [friendId]: "offline" }) })
    );
  });

  it("broadcasts an online transition only to accepted friends' rooms", async () => {
    const { gateway, authenticateSocket, to } = makeGateway();
    authenticateSocket.mockResolvedValue(true);
    const client = makeClient(authUser);

    await gateway.handleConnection(client);

    expect(to).toHaveBeenCalledWith(userPresenceRoom(friendId));
  });

  it("does not re-broadcast presence for a second connection from the same user (multi-tab)", async () => {
    const { gateway, authenticateSocket, to } = makeGateway();
    authenticateSocket.mockResolvedValue(true);

    await gateway.handleConnection(makeClient(authUser));
    to.mockClear();
    await gateway.handleConnection(makeClient(authUser));

    expect(to).not.toHaveBeenCalled();
  });

  it("ignores disconnect for a socket that never authenticated", async () => {
    const { gateway, presenceService } = makeGateway();
    const deregisterSpy = jest.spyOn(presenceService, "deregisterConnection");

    await gateway.handleDisconnect(makeClient(undefined));

    expect(deregisterSpy).not.toHaveBeenCalled();
  });
});
