import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { MovementCompletionEvent } from "../../../../../entity/systems/movement-completion-event";
import type { AiRuntimeCreatedActor } from "../../harness/capture/ai-runtime-created-actor";
import type { AiRuntimeRouteCaller } from "./ai-runtime-route-caller";

/** Detached marked execution observation. Arrival is physical endpoint evidence, never service fulfillment. */
export interface AiRuntimeMovement {
  readonly kind: "movement";
  readonly executionId: number;
  readonly phase: MovementCompletionEvent["phase"];
  readonly mode: MovementCompletionEvent["mode"];
  readonly source: AiRuntimeCreatedActor;
  readonly sourceInCaptureScene: boolean;
  readonly caller?: AiRuntimeRouteCaller;
  readonly originalDestination: Vector2Simple | null;
  readonly selectedDestination: Vector2Simple | null;
  readonly fallback: boolean;
  readonly actualTile: Vector2Simple | null;
}
