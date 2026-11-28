import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/** A tile step was safely completed, but its owning path was cancelled before arrival. */
export class MovementStepInterruptedError extends Error {
  constructor(readonly tile: Vector2Simple) {
    super(`Movement step to ${tile.x},${tile.y} was interrupted`);
    this.name = "MovementStepInterruptedError";
  }
}
