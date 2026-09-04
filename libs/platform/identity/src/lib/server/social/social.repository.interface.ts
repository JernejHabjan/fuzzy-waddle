import type { SocialFriendAction } from "@fuzzy-waddle/platform-database-schema";
import type { FriendRelationship, PublicSocialProfile, SocialSnapshot } from "../../social/friendship";
import type { FriendshipId, SocialUserId } from "../../social/social-identifiers";

/** Persistence boundary for transactional friendship, discovery, and block operations. */
export interface SocialRepositoryInterface {
  findUserByUsername(actorUserId: SocialUserId, username: string): Promise<PublicSocialProfile | null>;
  getSnapshot(actorUserId: SocialUserId): Promise<SocialSnapshot>;
  applyFriendAction(
    actorUserId: SocialUserId,
    action: SocialFriendAction,
    targetUserId?: SocialUserId,
    relationshipId?: FriendshipId
  ): Promise<FriendRelationship | null>;
}
