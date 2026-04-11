import { Injectable } from "@nestjs/common";
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
    // Cancel any pending eviction for the same player in the same game
    for (const [sid, entry] of this.pendingEvictions.entries()) {
      if (entry.userId === userId && entry.gameInstanceId === gameInstanceId) {
        clearTimeout(entry.timer);
        this.pendingEvictions.delete(sid);
        console.log(
          `[Reconnect] Player ${userId} reconnected to game ${gameInstanceId} within grace window.`
        );
        break;
      }
    }
  }

  /** Called when a player explicitly leaves a room (tab close / navigate away). */
  markExplicitQuit(socketId: string): void {
    // Remove the socket association — no grace window, the player chose to quit.
    this.socketToPlayer.delete(socketId);
    this.cancelPendingEviction(socketId);
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
      return null;
    }

    // Already have a pending eviction for this player? Shouldn't happen but guard it.
    this.cancelPendingEviction(socketId);

    const timer = setTimeout(() => {
      this.pendingEvictions.delete(socketId);
      console.log(
        `[Disconnect] Grace period expired for player ${player.userId} in game ${player.gameInstanceId}. Evicting.`
      );
      onEvict(player.userId, player.gameInstanceId);
    }, RECONNECT_WINDOW_MS);

    this.pendingEvictions.set(socketId, { ...player, timer });
    console.log(
      `[Disconnect] Player ${player.userId} disconnected from game ${player.gameInstanceId}. ` +
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

  /** Clean up all state for a game instance when it ends. */
  cleanupGame(gameInstanceId: GameInstanceId): void {
    for (const [sid, player] of this.socketToPlayer.entries()) {
      if (player.gameInstanceId === gameInstanceId) {
        this.socketToPlayer.delete(sid);
      }
    }
    for (const [sid, entry] of this.pendingEvictions.entries()) {
      if (entry.gameInstanceId === gameInstanceId) {
        clearTimeout(entry.timer);
        this.pendingEvictions.delete(sid);
      }
    }
  }
}
