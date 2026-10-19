import type { ActorId, Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

interface AirDestinationReservation {
  /** Stable owner used for replacement and lifecycle cleanup. */
  readonly actorId: ActorId;
  /** Reserved horizontal destination; ground height is intentionally absent. */
  readonly tile: Vector2Simple;
  /** Flight-definition height that separates independently stackable air layers. */
  readonly flightLayer: number;
  /** Monotonic generation guard for overlapping replacement movement callbacks. */
  readonly token: number;
}

/**
 * Owns air-only final destinations independently from ground footprints.
 * Tokens prevent completion of an older movement from releasing a replacement
 * order's reservation for the same actor.
 */
export class AirDestinationReservationStore {
  private readonly reservations = new Map<ActorId, AirDestinationReservation>();
  private nextToken = 1;

  /**
   * Reserves one horizontal air tile. Actors in `ignoredActorIds` belong to the
   * same deterministic group assignment and therefore cannot block one another.
   */
  reserve(
    actorId: ActorId,
    tile: Vector2Simple,
    flightLayer: number,
    ignoredActorIds: readonly ActorId[] = []
  ): number | undefined {
    const ignored = new Set(ignoredActorIds);
    const blocked = Array.from(this.reservations.values()).some(
      (reservation) =>
        reservation.actorId !== actorId &&
        !ignored.has(reservation.actorId) &&
        reservation.flightLayer === flightLayer &&
        reservation.tile.x === tile.x &&
        reservation.tile.y === tile.y
    );
    if (blocked) return undefined;

    const token = this.nextToken++;
    this.reservations.set(actorId, { actorId, tile: { ...tile }, flightLayer, token });
    return token;
  }

  /** Returns deterministic occupied tiles on one layer, excluding a forming group. */
  getReservedTiles(flightLayer: number, excludedActorIds: readonly ActorId[] = []): Vector2Simple[] {
    const excluded = new Set(excludedActorIds);
    return Array.from(this.reservations.values())
      .filter((reservation) => reservation.flightLayer === flightLayer && !excluded.has(reservation.actorId))
      .sort((left, right) => {
        if (left.tile.y !== right.tile.y) return left.tile.y - right.tile.y;
        if (left.tile.x !== right.tile.x) return left.tile.x - right.tile.x;
        return left.actorId < right.actorId ? -1 : left.actorId > right.actorId ? 1 : 0;
      })
      .map((reservation) => ({ ...reservation.tile }));
  }

  /** Releases only the reservation generation owned by the completing movement. */
  release(actorId: ActorId, token?: number): void {
    const reservation = this.reservations.get(actorId);
    if (!reservation || (token !== undefined && reservation.token !== token)) return;
    this.reservations.delete(actorId);
  }

  /** Clears scene-owned state during shutdown. */
  clear(): void {
    this.reservations.clear();
  }
}
