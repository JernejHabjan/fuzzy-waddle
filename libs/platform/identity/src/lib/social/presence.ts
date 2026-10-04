import type { SocialUserId } from "./social-identifiers";

export const PresenceState = {
  Online: "online",
  Offline: "offline"
} as const;

/** Server-derived activity state; clients cannot set this directly. */
export type PresenceState = (typeof PresenceState)[keyof typeof PresenceState];

/** Broadcast to a user's own room on connect/reconnect so presence converges from one snapshot. */
export interface PresenceSnapshot {
  /** Presence of every accepted friend, keyed by that friend's user id. */
  friends: Readonly<Record<SocialUserId, PresenceState>>;
}

/** Broadcast to every friend room whenever one user's derived presence changes. */
export interface PresenceChangedEvent {
  userId: SocialUserId;
  state: PresenceState;
}

export const GatewayPresenceEvent = {
  /** Emitted once to the connecting client right after authentication. */
  PresenceSnapshot: "presence-snapshot",
  /** Emitted to friend rooms whenever a user's presence transitions. */
  PresenceChanged: "presence-changed"
} as const;

export type GatewayPresenceEvent = (typeof GatewayPresenceEvent)[keyof typeof GatewayPresenceEvent];
