import type { AuthUser } from "@supabase/supabase-js";
import type { FriendRelationship, PublicSocialProfile, SocialSnapshot } from "../../social/friendship";
import type { SocialUserTargetDto } from "../../social/social-dtos";

/** Authenticated social command authority exposed to HTTP and future realtime adapters. */
export interface SocialServiceInterface {
  findUser(user: AuthUser, username: string): Promise<PublicSocialProfile | null>;
  getSnapshot(user: AuthUser): Promise<SocialSnapshot>;
  sendFriendRequest(user: AuthUser, body: SocialUserTargetDto): Promise<FriendRelationship>;
  acceptFriendRequest(user: AuthUser, relationshipId: string): Promise<FriendRelationship>;
  declineFriendRequest(user: AuthUser, relationshipId: string): Promise<void>;
  cancelFriendRequest(user: AuthUser, relationshipId: string): Promise<void>;
  removeFriend(user: AuthUser, relationshipId: string): Promise<void>;
  blockUser(user: AuthUser, body: SocialUserTargetDto): Promise<void>;
  unblockUser(user: AuthUser, targetUserId: string): Promise<void>;
}
