import type { FriendshipId, SocialUserId } from "./social-identifiers";

/** Exact username lookup query; partial and fuzzy discovery are intentionally unsupported. */
export interface FindSocialUserDto {
  username: string;
}

/** Target profile for a new friendship request or block mutation. */
export interface SocialUserTargetDto {
  targetUserId: SocialUserId;
}

/** Route parameter identifying the canonical request/friendship to mutate. */
export interface FriendshipTargetDto {
  relationshipId: FriendshipId;
}
