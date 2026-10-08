import type { AiRuntimeQueueCompletionV1 } from "./ai-runtime-queue-completion-v1";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import type { AiRuntimeQueueMutationV1 } from "./ai-runtime-queue-mutation-v1";
import type { GameCommand, GameCommandOutcome, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import type { AiRuntimeQueueResourceV1 } from "./ai-runtime-queue-resource-v1";

import type { AiRuntimeQueueProgressV1 } from "./ai-runtime-queue-progress-v1";
import type { AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import type { AiRuntimeProductionBoundaryState } from "./ai-runtime-production-boundary-state";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import type { AiRuntimeConstructionV1 } from "./ai-runtime-construction-v1";
import type { AiRuntimeRecipientMutationV1 } from "./ai-runtime-recipient-mutation-v1";

/** Raw authority callbacks in observer order. No resource event is labelled a payment/refund without item provenance. */
export type AiRuntimeProductionFactV1 = {
  readonly sequence: number;
  readonly tick: number;
  readonly playerNumber: number;
  /** Callback-time state after the diagnostic ledger update; optional only for older/synthetic records. */
  readonly boundaryState?: AiRuntimeProductionBoundaryState;
} & (
  | { readonly kind: "recipient_resources_installed"; readonly resources: Record<ResourceType, number> | null }
  | { readonly kind: "recipient_resource_mutation"; readonly mutation: AiRuntimeRecipientMutationV1 }
  | {
    readonly kind: "outcome";
    readonly outcome: GameCommandOutcome;
    /** Sample before this outcome changes pending ownership; queue/cash are already at observer time. */
    readonly boundaryStateBefore?: AiRuntimeProductionBoundaryState;
    /** Bus intended execution tick only on dispatched callbacks; the enclosing tick is observation time. */
    readonly scheduledTick: number | null;
  }
  | { readonly kind: "decision_selected"; readonly decision: AiDecisionDispatchEvent }
  | { readonly kind: "construction_authority"; readonly construction: AiRuntimeConstructionV1 }
  | { readonly kind: "spatial_authority"; readonly spatial: AiRuntimeProductionSpatialV1 }
  | {
    readonly kind: "intent_dispatch";
    readonly event: AiIntentCommandDispatchEvent;
    /** Exact pre-callback ledger state; rejected receipt releases selected claims before the after sample. */
    readonly boundaryStateBefore?: AiRuntimeProductionBoundaryState;
  }
  | { readonly kind: "queue_completion"; readonly completion: AiRuntimeQueueCompletionV1 }
  | { readonly kind: "actor_registered"; readonly actor: AiRuntimeCreatedActorV1; readonly snapshotRestoreInProgress: boolean }
  | { readonly kind: "queue_mutation"; readonly mutation: AiRuntimeQueueMutationV1 }
  | { readonly kind: "queue_progress"; readonly progress: AiRuntimeQueueProgressV1 }
  | { readonly kind: "queue_resource"; readonly resource: AiRuntimeQueueResourceV1 }
  /** Delivery observation can follow component application; this is explicitly not a dispatch/request timestamp. */
  | { readonly kind: "command_delivered"; readonly command: GameCommand }
  | {
    readonly kind: "resources_applied";
    readonly action: "resource.added" | "resource.removed";
    readonly amounts: Readonly<Partial<Record<ResourceType, number>>>;
    /** Last observed shared balance. This is not an operation-scoped sample before the underlying payment/refund. */
    readonly before: Readonly<Record<ResourceType, number>>;
    readonly after: Readonly<Record<ResourceType, number>>;
    readonly balanceMatches: boolean;
  }
  | { readonly kind: "queue_changed"; readonly queue: AiRuntimeProductionQueueV1 }
  | { readonly kind: "research_completed"; readonly researchType: ResearchType }
  | { readonly kind: "actor_unregistered"; readonly actorId: string; readonly objectName: string }
);
