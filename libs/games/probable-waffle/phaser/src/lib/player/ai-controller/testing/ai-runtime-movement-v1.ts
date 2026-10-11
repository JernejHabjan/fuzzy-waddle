import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { MovementCompletionEvent } from "../../../entity/systems/movement-completion-event";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import type { AiRuntimeRouteCallerV1 } from "./ai-runtime-route-caller-v1";

/** Detached marked execution observation. Arrival is physical endpoint evidence, never service fulfillment. */
export interface AiRuntimeMovementV1 {
  readonly kind: "movement";
  readonly executionId: number;
  readonly phase: MovementCompletionEvent["phase"];
  readonly mode: MovementCompletionEvent["mode"];
  readonly source: AiRuntimeCreatedActorV1;
  readonly sourceInCaptureScene: boolean;
  readonly caller?: AiRuntimeRouteCallerV1;
  readonly originalDestination: Vector2Simple | null;
  readonly selectedDestination: Vector2Simple | null;
  readonly fallback: boolean;
  readonly actualTile: Vector2Simple | null;
}
