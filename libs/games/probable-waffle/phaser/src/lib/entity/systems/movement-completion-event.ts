import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { MovementQueryContext } from "./movement-query-context";

/** Physical execution boundaries, separate from path queries and the native boolean return. Never persisted. */
export interface MovementCompletionEvent {
  readonly context: MovementQueryContext;
  /** Weak identity of one execution, including its recursive recovery. */
  readonly execution: object;
  readonly phase: "started" | "destination" | "arrived" | "stopped" | "returned_true" | "returned_false" | "threw";
  readonly mode: "path" | "direct";
  /** Tile request, or the first selected actor-radius endpoint. Not necessarily the order's service target. */
  readonly originalDestination: Vector2Simple | null;
  readonly selectedDestination: Vector2Simple | null;
  /** Sticky once native execution selects a fallback, even if later recovery changes it again. */
  readonly fallback: boolean;
  readonly actualTile: Vector2Simple | null;
}
