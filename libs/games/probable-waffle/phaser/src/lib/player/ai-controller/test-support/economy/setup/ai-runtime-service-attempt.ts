import type { PawnResourceServiceEvent } from "../../../../../prefabs/ai-agents/resources/pawn-resource-service-event";
import type { AiRuntimeCreatedActor } from "../../harness/capture/ai-runtime-created-actor";
import type { AiRuntimeRouteOrder } from "../../navigation/controls/ai-runtime-route-order";

/** Detached native attempt. Amount is the callee result, never an applied-resource or cargo-ownership claim. */
export interface AiRuntimeServiceAttempt {
  readonly kind: "service_attempt";
  readonly attemptId: number;
  readonly operation: PawnResourceServiceEvent["operation"];
  readonly phase: PawnResourceServiceEvent["phase"];
  readonly amount: number | null;
  readonly source: AiRuntimeCreatedActor;
  readonly target: AiRuntimeCreatedActor;
  readonly sourceInCaptureScene: boolean;
  readonly targetInCaptureScene: boolean;
  /** Frozen at native start. Omission is observation loss; later samples cannot fill it. */
  readonly order?: AiRuntimeRouteOrder;
  readonly lifetimeValid: boolean;
}
