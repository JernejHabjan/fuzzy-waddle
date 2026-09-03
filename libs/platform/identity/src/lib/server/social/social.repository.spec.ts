import { FriendRelationshipStatus, SocialFriendAction } from "@fuzzy-waddle/platform-database-schema";
import type { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import { FriendshipDirection } from "../../social/friendship";
import { asSocialUserId } from "../../social/social-identifiers";
import { SocialRepository } from "./social.repository";

describe("SocialRepository", () => {
  const actorId = asSocialUserId("11111111-1111-4111-8111-111111111111");
  const targetId = asSocialUserId("22222222-2222-4222-8222-222222222222");
  const rpc = jest.fn();
  const provider = { supabaseClient: { rpc } } as unknown as SupabaseProviderService;
  const repository = new SocialRepository(provider);

  beforeEach(() => jest.clearAllMocks());

  it("decodes the minimal exact-username projection", async () => {
    rpc.mockResolvedValue({
      data: { id: targetId, username: "target_user", displayName: "Target", avatarUrl: null },
      error: null
    });

    await expect(repository.findUserByUsername(actorId, "target_user")).resolves.toEqual({
      id: targetId,
      username: "target_user",
      displayName: "Target",
      avatarUrl: null
    });
  });

  it("passes a generic action without team or matchmaking assumptions", async () => {
    rpc.mockResolvedValue({
      data: {
        id: "33333333-3333-4333-8333-333333333333",
        status: FriendRelationshipStatus.Pending,
        direction: FriendshipDirection.Outbound,
        requesterId: actorId,
        user: { id: targetId, username: "target_user", displayName: "Target", avatarUrl: null },
        createdAt: "2026-08-15T00:00:00Z",
        updatedAt: "2026-08-15T00:00:00Z",
        acceptedAt: null
      },
      error: null
    });

    await repository.applyFriendAction(actorId, SocialFriendAction.SendRequest, targetId);

    expect(rpc).toHaveBeenCalledWith("social_apply_friend_action", {
      p_actor_user_id: actorId,
      p_action: SocialFriendAction.SendRequest,
      p_target_user_id: targetId,
      p_relationship_id: undefined
    });
  });

  it("rejects malformed database projections", async () => {
    rpc.mockResolvedValue({ data: { relationships: "invalid", blocks: [] }, error: null });

    await expect(repository.getSnapshot(actorId)).rejects.toThrow("social_invalid_relationships");
  });

  it("propagates a raised social state-machine code", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "social_self_action" } });

    await expect(repository.getSnapshot(actorId)).rejects.toThrow("social_self_action");
  });

  it("masks unknown persistence errors instead of guessing a code from free text", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "08006", message: "connection refused" } });

    await expect(repository.getSnapshot(actorId)).rejects.toThrow("social_persistence_failure");
  });
});
