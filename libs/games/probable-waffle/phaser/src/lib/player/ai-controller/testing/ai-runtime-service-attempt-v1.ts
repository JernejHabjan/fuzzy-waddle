import type { PawnResourceServiceEvent } from "../../../prefabs/ai-agents/pawn-resource-service-event";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import type { AiRuntimeRouteOrderV1 } from "./ai-runtime-route-order-v1";

/** Detached native attempt. Amount is the callee result, never an applied-resource or cargo-ownership claim. */
export interface AiRuntimeServiceAttemptV1 {
  readonly kind: "service_attempt";
  readonly attemptId: number;
  readonly operation: PawnResourceServiceEvent["operation"];
  readonly phase: PawnResourceServiceEvent["phase"];
  readonly amount: number | null;
  readonly source: AiRuntimeCreatedActorV1;
  readonly target: AiRuntimeCreatedActorV1;
  readonly sourceInCaptureScene: boolean;
  readonly targetInCaptureScene: boolean;
  /** Frozen at native start. Omission is observation loss; later samples cannot fill it. */
  readonly order?: AiRuntimeRouteOrderV1;
  readonly lifetimeValid: boolean;
}
