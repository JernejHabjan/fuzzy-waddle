import type { ActorId, Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/**
 * Signals that the next tile in an otherwise valid path is temporarily blocked
 * by dynamic actor occupancy rather than static terrain connectivity.
 */
export class MovementStepBlockedError extends Error {
  constructor(
    readonly tile: Vector2Simple,
    readonly blockers: ActorId[]
  ) {
    super("Next movement tile is occupied");
  }
}
