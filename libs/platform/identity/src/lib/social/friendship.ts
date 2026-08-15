import type { FriendRelationshipStatus } from "@fuzzy-waddle/platform-database-schema";
import type { FriendshipId, SocialUserId } from "./social-identifiers";

export const FriendshipDirection = {
  Inbound: "inbound",
  Outbound: "outbound",
  Friend: "friend"
} as const;

/** Viewer-relative state of a request or accepted friendship. */
export type FriendshipDirection = (typeof FriendshipDirection)[keyof typeof FriendshipDirection];

/** Minimum active-profile projection exposed by exact username discovery and social snapshots. */
export interface PublicSocialProfile {
  /** Stable identity shared by later party and generic FFA/team matchmaking tickets. */
  id: SocialUserId;
  /** Case-insensitively unique username used only for exact discovery. */
  username: string | null;
  /** Human-facing name; it is not an identity or authorization key. */
  displayName: string;
  /** Optional public avatar presentation URL. */
  avatarUrl: string | null;
}

/** Canonical relationship projected relative to the authenticated viewer. */
export interface FriendRelationship {
  id: FriendshipId;
  status: FriendRelationshipStatus;
  direction: FriendshipDirection;
  requesterId: SocialUserId;
  user: PublicSocialProfile;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
}

/** One directional block created and visible only to its owner. */
export interface UserBlock {
  user: PublicSocialProfile;
  createdAt: string;
}

/** Authoritative social state returned after commands and used for reconnect convergence. */
export interface SocialSnapshot {
  relationships: readonly FriendRelationship[];
  blocks: readonly UserBlock[];
}
