import type { GameCommand, GameCommandOutcome, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import type { AiRuntimeQueueResourceV1 } from "./ai-runtime-queue-resource-v1";

/** Raw authority callbacks in observer order. No resource event is labelled a payment/refund without item provenance. */
export type AiRuntimeProductionFactV1 = {
  readonly sequence: number;
  readonly tick: number;
  readonly playerNumber: number;
} & (
  | {
    readonly kind: "outcome";
    readonly outcome: GameCommandOutcome;
    /** Bus intended execution tick only on dispatched callbacks; the enclosing tick is observation time. */
    readonly scheduledTick: number | null;
  }
  | { readonly kind: "intent_dispatch"; readonly event: AiIntentCommandDispatchEvent }
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
