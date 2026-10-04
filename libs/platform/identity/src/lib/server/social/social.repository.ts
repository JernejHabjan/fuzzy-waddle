import { Injectable } from "@nestjs/common";
import type { Json, SocialFriendAction } from "@fuzzy-waddle/platform-database-schema";
import { FriendRelationshipStatus } from "@fuzzy-waddle/platform-database-schema";
import { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import {
  FriendshipDirection,
  type FriendRelationship,
  type PublicSocialProfile,
  type SocialSnapshot,
  type UserBlock
} from "../../social/friendship";
import { asFriendshipId, asSocialUserId, type FriendshipId, type SocialUserId } from "../../social/social-identifiers";
import { SocialRepositoryError } from "./social-repository.error";
import type { SocialRepositoryInterface } from "./social.repository.interface";

type JsonObject = { [key: string]: Json | undefined };

@Injectable()
export class SocialRepository implements SocialRepositoryInterface {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async findUserByUsername(actorUserId: SocialUserId, username: string): Promise<PublicSocialProfile | null> {
    const { data, error } = await this.supabaseProviderService.supabaseClient.rpc("social_find_user_by_username", {
      p_actor_user_id: actorUserId,
      p_username: username
    });
    this.throwPersistenceError(error);
    return data == null ? null : decodeProfile(data);
  }

  async getSnapshot(actorUserId: SocialUserId): Promise<SocialSnapshot> {
    const { data, error } = await this.supabaseProviderService.supabaseClient.rpc("social_get_snapshot", {
      p_actor_user_id: actorUserId
    });
    this.throwPersistenceError(error);
    return decodeSnapshot(data);
  }

  async applyFriendAction(
    actorUserId: SocialUserId,
    action: SocialFriendAction,
    targetUserId?: SocialUserId,
    relationshipId?: FriendshipId
  ): Promise<FriendRelationship | null> {
    const { data, error } = await this.supabaseProviderService.supabaseClient.rpc("social_apply_friend_action", {
      p_actor_user_id: actorUserId,
      p_action: action,
      p_target_user_id: targetUserId,
      p_relationship_id: relationshipId
    });
    this.throwPersistenceError(error);
    return data == null ? null : decodeRelationship(data);
  }

  /**
   * Converts database-raised state-machine codes into a transport-independent repository error.
   * Postgres `raise exception '<code>' using errcode = 'P0001'` surfaces as a PostgREST error with
   * `code = 'P0001'` and `message = '<code>'`; only that pair is treated as a known social code, so
   * genuine infrastructure failures (network, permissions, unexpected Postgres errors) surface as
   * an opaque `social_persistence_failure` instead of being misread from arbitrary error text.
   */
  private throwPersistenceError(error?: { code?: string; message?: string } | null): void {
    if (!error) return;
    const isRaisedSocialCode = error.code === "P0001" && !!error.message && /^social_[a-z_]+$/.test(error.message);
    throw new SocialRepositoryError(isRaisedSocialCode ? (error.message as string) : "social_persistence_failure");
  }
}

function decodeSnapshot(value: Json): SocialSnapshot {
  const object = requireObject(value, "social snapshot");
  const relationships = requireArray(object.relationships, "relationships").map(decodeRelationship);
  const blocks = requireArray(object.blocks, "blocks").map(decodeBlock);
  return { relationships, blocks };
}

function decodeRelationship(value: Json): FriendRelationship {
  const object = requireObject(value, "friend relationship");
  const status = requireString(object.status, "status");
  const direction = requireString(object.direction, "direction");
  if (status !== FriendRelationshipStatus.Pending && status !== FriendRelationshipStatus.Accepted) {
    throw new SocialRepositoryError("social_invalid_relationship_status");
  }
  if (!Object.values(FriendshipDirection).includes(direction as FriendshipDirection)) {
    throw new SocialRepositoryError("social_invalid_relationship_direction");
  }
  return {
    id: asFriendshipId(requireString(object.id, "id")),
    status,
    direction: direction as FriendshipDirection,
    requesterId: asSocialUserId(requireString(object.requesterId, "requesterId")),
    user: decodeProfile(object.user),
    createdAt: requireString(object.createdAt, "createdAt"),
    updatedAt: requireString(object.updatedAt, "updatedAt"),
    acceptedAt: nullableString(object.acceptedAt, "acceptedAt")
  };
}

function decodeBlock(value: Json): UserBlock {
  const object = requireObject(value, "user block");
  return {
    user: decodeProfile(object.user),
    createdAt: requireString(object.createdAt, "createdAt")
  };
}

function decodeProfile(value: Json | undefined): PublicSocialProfile {
  const object = requireObject(value, "public social profile");
  return {
    id: asSocialUserId(requireString(object.id, "id")),
    username: nullableString(object.username, "username"),
    displayName: requireString(object.displayName, "displayName"),
    avatarUrl: nullableString(object.avatarUrl, "avatarUrl")
  };
}

function requireObject(value: Json | undefined, field: string): JsonObject {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new SocialRepositoryError(`social_invalid_${field.replaceAll(" ", "_")}`);
  }
  return value;
}

function requireArray(value: Json | undefined, field: string): Json[] {
  if (!Array.isArray(value)) throw new SocialRepositoryError(`social_invalid_${field}`);
  return value;
}

function requireString(value: Json | undefined, field: string): string {
  if (typeof value !== "string") throw new SocialRepositoryError(`social_invalid_${field}`);
  return value;
}

function nullableString(value: Json | undefined, field: string): string | null {
  if (value === null) return null;
  return requireString(value, field);
}
