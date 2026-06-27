import { Injectable, Logger } from "@nestjs/common";
import type { GameInstanceId, UserId } from "@fuzzy-waddle/api-interfaces";

/** How long (ms) to hold a player's slot after a network disconnect before evicting. */
const RECONNECT_WINDOW_MS = 60_000;

interface DisconnectedEntry {
  userId: UserId;
  gameInstanceId: GameInstanceId;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Tracks socket-to-player associations and holds disconnected player slots
 * open for RECONNECT_WINDOW_MS before they are considered gone.
 *
 * Distinguish disconnect types:
 *  - Explicit quit: client sends a "leave" room event before closing.
 *    `markExplicitQuit` cancels the grace timer immediately.
 *  - Network drop / tab crash: only `handleDisconnect` fires.
 *    Slot is held for RECONNECT_WINDOW_MS; if the player rejoins the room
 *    within that window, `cancelPendingEviction` removes the timer.
 */
@Injectable()
export class PlayerDisconnectTrackerService {
  private readonly logger = new Logger(PlayerDisconnectTrackerService.name);
  private readonly debug = process.env.PROBABLE_WAFFLE_MULTIPLAYER_DEBUG === "true";

  /** socketId → { userId, gameInstanceId } populated on room-join. */
  private readonly socketToPlayer = new Map<string, { userId: UserId; gameInstanceId: GameInstanceId }>();

  /** socketId → pending-eviction timer for reconnect window. */
  private readonly pendingEvictions = new Map<string, DisconnectedEntry>();

  /**
   * Called when a player joins a socket.io room.
   * Also cancels any in-flight eviction timer for this userId/gameInstanceId
   * (handles the reconnect case where the socket ID changes).
   */
  registerSocket(socketId: string, userId: UserId, gameInstanceId: GameInstanceId): void {
    this.socketToPlayer.set(socketId, { userId, gameInstanceId });
    this.debugLog(`register socket=${socketId} user=${userId} game=${gameInstanceId}`);
    this.cancelPendingEvictionForPlayer(userId, gameInstanceId);
  }

  /** Called when a player explicitly leaves a room (tab close / navigate away). */
  markExplicitQuit(socketId: string): { userId: UserId; gameInstanceId: GameInstanceId } | null {
    const player = this.socketToPlayer.get(socketId) ?? null;
    this.debugLog(`explicit-quit socket=${socketId} found=${player ? "yes" : "no"}`);
    this.socketToPlayer.delete(socketId);
    this.cancelPendingEviction(socketId);
    if (player && this.hasActiveSocketForPlayer(player.userId, player.gameInstanceId)) {
      return null;
    }
    return player;
  }

  /**
   * Called by the gateway's handleDisconnect hook.
   * Returns the player info if found so the caller can start the grace period.
   */
  handleDisconnect(
    socketId: string,
    onEvict: (userId: UserId, gameInstanceId: GameInstanceId) => void
  ): { userId: UserId; gameInstanceId: GameInstanceId } | null {
    const player = this.socketToPlayer.get(socketId);
    this.socketToPlayer.delete(socketId);

    if (!player) {
      this.debugLog(`disconnect socket=${socketId} found=no`);
      return null;
    }

    this.cancelPendingEviction(socketId);
    if (this.hasActiveSocketForPlayer(player.userId, player.gameInstanceId)) {
      this.debugLog(
        `[Disconnect] Ignoring disconnect for player ${player.userId} in game ${player.gameInstanceId} because another socket is still active.`
      );
      return null;
    }

    const timer = setTimeout(() => {
      this.pendingEvictions.delete(socketId);
      this.logger.warn(
        `[Disconnect] Grace period expired for player ${player.userId} in game ${player.gameInstanceId}. Evicting.`
      );
      onEvict(player.userId, player.gameInstanceId);
    }, RECONNECT_WINDOW_MS);

    this.pendingEvictions.set(socketId, { ...player, timer });
    this.logger.warn(
      `[Disconnect] Player ${player.userId} disconnected from game ${player.gameInstanceId} on socket ${socketId}. ` +
        `Holding slot for ${RECONNECT_WINDOW_MS / 1000}s.`
    );

    return player;
  }

  private cancelPendingEviction(socketId: string): void {
    const entry = this.pendingEvictions.get(socketId);
    if (entry) {
      clearTimeout(entry.timer);
      this.pendingEvictions.delete(socketId);
    }
  }

  private cancelPendingEvictionForPlayer(userId: UserId, gameInstanceId: GameInstanceId): void {
    let cancelled = 0;
    for (const [sid, entry] of this.pendingEvictions.entries()) {
      if (entry.userId === userId && entry.gameInstanceId === gameInstanceId) {
        clearTimeout(entry.timer);
        this.pendingEvictions.delete(sid);
        cancelled++;
      }
    }
    if (cancelled > 0) {
      this.logger.warn(
        `[Reconnect] Player ${userId} reconnected to game ${gameInstanceId} within grace window. Cleared ${cancelled} pending eviction timer(s).`
      );
    }
  }

  private hasActiveSocketForPlayer(userId: UserId, gameInstanceId: GameInstanceId): boolean {
    for (const player of this.socketToPlayer.values()) {
      if (player.userId === userId && player.gameInstanceId === gameInstanceId) {
        return true;
      }
    }
    return false;
  }

  isUserDisconnected(userId: UserId, gameInstanceId: GameInstanceId): boolean {
    for (const entry of this.pendingEvictions.values()) {
      if (entry.userId === userId && entry.gameInstanceId === gameInstanceId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns all currently active socket IDs for a player in one game instance.
   * Used for targeted relays (e.g. snapshot response to one reconnecting user).
   */
  getActiveSocketIdsForPlayer(userId: UserId, gameInstanceId: GameInstanceId): string[] {
    const socketIds: string[] = [];
    for (const [socketId, player] of this.socketToPlayer.entries()) {
      if (player.userId === userId && player.gameInstanceId === gameInstanceId) {
        socketIds.push(socketId);
      }
    }
    return socketIds;
  }

  private debugLog(message: string): void {
    if (!this.debug) {
      return;
    }
    this.logger.debug(`[DisconnectTracker] ${message}`);
  }
}
