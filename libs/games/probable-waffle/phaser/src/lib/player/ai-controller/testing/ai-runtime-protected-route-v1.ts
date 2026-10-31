import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Fixed world-space endpoints; tileMargin is a conservative static tile envelope, not a unit collider certificate. */
export interface AiRuntimeProtectedRouteV1 {
  readonly id: string;
  readonly playerNumber: number;
  readonly from: Vector2Simple;
  readonly to: Vector2Simple;
  readonly tileMargin: number;
}
