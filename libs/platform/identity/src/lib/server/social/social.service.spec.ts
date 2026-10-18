import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { FriendRelationshipStatus, SocialFriendAction } from "@fuzzy-waddle/platform-database-schema";
import { FriendshipDirection, type FriendRelationship } from "../../social/friendship";
import { asFriendshipId, asSocialUserId } from "../../social/social-identifiers";
import { SocialRepositoryError } from "./social-repository.error";
import { SocialRepository } from "./social.repository";
import { SocialService } from "./social.service";

describe("SocialService", () => {
  const actorId = "11111111-1111-4111-8111-111111111111";
  const targetId = "22222222-2222-4222-8222-222222222222";
  const relationshipId = "33333333-3333-4333-8333-333333333333";
  const user = { id: actorId } as AuthUser;
  const relationship: FriendRelationship = {
    id: asFriendshipId(relationshipId),
    status: FriendRelationshipStatus.Pending,
    direction: FriendshipDirection.Outbound,
    requesterId: asSocialUserId(actorId),
    user: {
      id: asSocialUserId(targetId),
      username: "target_user",
      displayName: "Target User",
      avatarUrl: null
    },
    createdAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-08-15T00:00:00Z",
    acceptedAt: null
  };
  const repository = {
    findUserByUsername: jest.fn(),
    getSnapshot: jest.fn(),
    applyFriendAction: jest.fn()
  };
  let service: SocialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SocialService(repository as unknown as SocialRepository);
  });

  it("normalizes exact username discovery", async () => {
    repository.findUserByUsername.mockResolvedValue(relationship.user);

    await expect(service.findUser(user, "  Target_User ")).resolves.toEqual(relationship.user);

    expect(repository.findUserByUsername).toHaveBeenCalledWith(asSocialUserId(actorId), "Target_User");
  });

  it("rejects invalid exact usernames before persistence", async () => {
    await expect(service.findUser(user, " ")).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findUserByUsername).not.toHaveBeenCalled();
  });

  it("sends a request through the transactional state machine", async () => {
    repository.applyFriendAction.mockResolvedValue(relationship);

    await expect(service.sendFriendRequest(user, { targetUserId: asSocialUserId(targetId) })).resolves.toEqual(
      relationship
    );

    expect(repository.applyFriendAction).toHaveBeenCalledWith(
      asSocialUserId(actorId),
      SocialFriendAction.SendRequest,
      asSocialUserId(targetId)
    );
  });

  it("accepts an inbound request and preserves its relationship id", async () => {
    repository.applyFriendAction.mockResolvedValue({
      ...relationship,
      status: FriendRelationshipStatus.Accepted,
      direction: FriendshipDirection.Friend
    });

    await service.acceptFriendRequest(user, relationshipId);

    expect(repository.applyFriendAction).toHaveBeenCalledWith(
      asSocialUserId(actorId),
      SocialFriendAction.AcceptRequest,
      undefined,
      asFriendshipId(relationshipId)
    );
  });

  it("returns the authoritative reconnect snapshot", async () => {
    const snapshot = { relationships: [relationship], blocks: [] };
    repository.getSnapshot.mockResolvedValue(snapshot);

    await expect(service.getSnapshot(user)).resolves.toEqual(snapshot);
    expect(repository.getSnapshot).toHaveBeenCalledWith(asSocialUserId(actorId));
  });

  it.each([
    ["declineFriendRequest", SocialFriendAction.DeclineRequest],
    ["cancelFriendRequest", SocialFriendAction.CancelRequest],
    ["removeFriend", SocialFriendAction.RemoveFriend]
  ] as const)("routes %s through the shared mutation boundary", async (method, action) => {
    repository.applyFriendAction.mockResolvedValue(null);

    await service[method](user, relationshipId);

    expect(repository.applyFriendAction).toHaveBeenCalledWith(
      asSocialUserId(actorId),
      action,
      undefined,
      asFriendshipId(relationshipId)
    );
  });

  it("maps block privacy failures to forbidden", async () => {
    repository.applyFriendAction.mockRejectedValue(new SocialRepositoryError("social_interaction_blocked"));

    await expect(service.sendFriendRequest(user, { targetUserId: asSocialUserId(targetId) })).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it.each([
    ["blockUser", SocialFriendAction.Block],
    ["unblockUser", SocialFriendAction.Unblock]
  ] as const)("routes %s through the pair-serialized safety boundary", async (method, action) => {
    repository.applyFriendAction.mockResolvedValue(null);

    if (method === "blockUser") {
      await service.blockUser(user, { targetUserId: asSocialUserId(targetId) });
    } else {
      await service.unblockUser(user, targetId);
    }

    expect(repository.applyFriendAction).toHaveBeenCalledWith(
      asSocialUserId(actorId),
      action,
      asSocialUserId(targetId)
    );
  });

  it("maps unavailable or inactive users to not found", async () => {
    repository.findUserByUsername.mockRejectedValue(new SocialRepositoryError("social_user_unavailable"));

    await expect(service.findUser(user, "target_user")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects malformed target identifiers before persistence", async () => {
    await expect(
      service.sendFriendRequest(user, { targetUserId: asSocialUserId("not-a-uuid") })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.applyFriendAction).not.toHaveBeenCalled();
  });
});
