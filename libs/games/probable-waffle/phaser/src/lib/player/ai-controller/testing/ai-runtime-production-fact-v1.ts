import type { GameCommand, GameCommandOutcome, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

/** Raw authority callbacks in observer order. No resource event is labelled a payment/refund without item provenance. */
export type AiRuntimeProductionFactV1 = {
  readonly sequence: number;
  readonly tick: number;
  readonly playerNumber: number;
} & (
  | { readonly kind: "outcome"; readonly outcome: GameCommandOutcome }
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
