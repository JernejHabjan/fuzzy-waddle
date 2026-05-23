import type { GameCommand } from "../../data/commands/game-command";
import type { PlayerNumber } from "@fuzzy-waddle/api-interfaces";

/**
 * Per-tick per-player command buffer for deterministic lockstep.
 *
 * A player is considered "committed" for a tick as soon as their Map entry
 * exists — even if their command list is empty. This is how the barrier
 * distinguishes "no commands this tick" from "haven't heard from them yet".
 */
export class CommandBuffer {
  // outer key: tick, inner key: playerNumber → committed commands (possibly empty)
  private readonly buffer = new Map<number, Map<PlayerNumber, GameCommand[]>>();

  /**
   * Record commands from one player for a given tick.
   * May be called multiple times for the same (tick, playerNumber) pair;
   * later calls append rather than overwrite.
   */
  commit(tick: number, playerNumber: PlayerNumber, commands: GameCommand[]): void {
    if (!this.buffer.has(tick)) {
      this.buffer.set(tick, new Map());
    }
    const tickMap = this.buffer.get(tick)!;
    const existing = tickMap.get(playerNumber);
    if (existing) {
      existing.push(...commands);
    } else {
      tickMap.set(playerNumber, [...commands]);
    }
  }

  /** Returns true only if every player in playerNumbers has committed for this tick. */
  hasAll(tick: number, playerNumbers: readonly PlayerNumber[]): boolean {
    const tickMap = this.buffer.get(tick);
    if (!tickMap) return false;
    return playerNumbers.every((pn) => tickMap.has(pn));
  }

  getCommittedPlayers(tick: number): PlayerNumber[] {
    const tickMap = this.buffer.get(tick);
    if (!tickMap) return [];
    return [...tickMap.keys()].sort((a, b) => a - b);
  }

  hasPlayerCommit(tick: number, playerNumber: PlayerNumber): boolean {
    const tickMap = this.buffer.get(tick);
    if (!tickMap) return false;
    return tickMap.has(playerNumber);
  }

  /**
   * Returns all committed commands for the tick sorted by playerNumber (deterministic),
   * then removes the tick entry from the buffer.
   */
  flush(tick: number): GameCommand[] {
    const tickMap = this.buffer.get(tick);
    if (!tickMap) return [];
    this.buffer.delete(tick);
    return [...tickMap.entries()]
      .sort(([a], [b]) => a - b)
      .flatMap(([, cmds]) => cmds);
  }

  /**
   * Discard ticks older than currentTick - maxAge to prevent unbounded growth.
   * Call once per tick advance.
   */
  gc(currentTick: number, maxAge = 120): void {
    for (const tick of this.buffer.keys()) {
      if (tick < currentTick - maxAge) this.buffer.delete(tick);
    }
  }

  clear(): void {
    this.buffer.clear();
  }
}
