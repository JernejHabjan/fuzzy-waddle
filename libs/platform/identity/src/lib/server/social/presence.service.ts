import { Injectable } from "@nestjs/common";
import type { SocialUserId } from "../../social/social-identifiers";
import { PresenceState } from "../../social/presence";

/** Reconnect grace window: a dropped socket does not flip a user offline until this elapses. */
export const PRESENCE_RECONNECT_GRACE_MS = 15_000;

interface ConnectionEntry {
  socketCount: number;
  graceTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Tracks authenticated socket connection counts per user in memory and derives online/offline
 * presence from them. Multiple tabs/devices share one counter so closing one tab never produces a
 * false offline transition, and a short reconnect grace window absorbs brief network drops.
 */
@Injectable()
export class PresenceService {
  private readonly connections = new Map<SocialUserId, ConnectionEntry>();

  /** Registers one more authenticated socket for the user. Returns true if this is an online transition. */
  registerConnection(userId: SocialUserId): boolean {
    const entry = this.connections.get(userId) ?? { socketCount: 0, graceTimer: null };
    const wasOnline = entry.socketCount > 0 || entry.graceTimer !== null;
    if (entry.graceTimer) {
      clearTimeout(entry.graceTimer);
      entry.graceTimer = null;
    }
    entry.socketCount += 1;
    this.connections.set(userId, entry);
    return !wasOnline;
  }

  /**
   * Releases one authenticated socket for the user. When the last socket disconnects, presence
   * stays "online" until the reconnect grace window elapses without a new connection, at which
   * point `onOffline` is invoked.
   */
  deregisterConnection(userId: SocialUserId, onOffline: (userId: SocialUserId) => void): void {
    const entry = this.connections.get(userId);
    if (!entry) return;
    entry.socketCount = Math.max(0, entry.socketCount - 1);
    if (entry.socketCount > 0) return;

    entry.graceTimer = setTimeout(() => {
      const current = this.connections.get(userId);
      if (!current || current.socketCount > 0) return;
      this.connections.delete(userId);
      onOffline(userId);
    }, PRESENCE_RECONNECT_GRACE_MS);
  }

  getState(userId: SocialUserId): PresenceState {
    const entry = this.connections.get(userId);
    if (!entry) return PresenceState.Offline;
    // A pending grace timer means the last socket dropped but the reconnect window hasn't
    // elapsed yet, so the user is still reported online.
    return entry.socketCount > 0 || entry.graceTimer ? PresenceState.Online : PresenceState.Offline;
  }
}
