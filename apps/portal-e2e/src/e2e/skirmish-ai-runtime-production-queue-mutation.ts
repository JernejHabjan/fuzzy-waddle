import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeQueueMutationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-queue-mutation-v1";

/** Physical queue interval only. Removal for completion does not prove a created actor, registered tech or useful effect. */
export interface RuntimeProductionQueueMutationV1 {
  readonly mutationId: number;
  readonly operation: AiRuntimeQueueMutationV1["operation"];
  readonly sequence: number;
  readonly tick: number;
  /** Enqueue/completion use the purchase; cancellation uses its distinct applied command. */
  readonly commandId: string;
  readonly originatingCommandId: string;
  readonly effectId: string;
  readonly planId: string;
  readonly actorId: string;
  readonly laneId: string;
  readonly itemIndex: number;
  readonly item: NonNullable<AiRuntimeQueueMutationV1["item"]>;
  readonly boundarySequences: readonly [number, number];
  readonly resourcesBefore: Readonly<Record<ResourceType, number>>;
  readonly resourcesAfter: Readonly<Record<ResourceType, number>>;
  readonly obligationsDue: Readonly<Record<ResourceType, number>>;
  readonly obligationsAfter: Readonly<Record<ResourceType, number>>;
  /** Captured queue-claim subset; unsupported ownership remains null. */
  readonly reservedUnspentBefore: Readonly<Record<ResourceType, number>> | null;
  readonly reservedUnspentAfter: Readonly<Record<ResourceType, number>> | null;
  /** Genuine request observation and bus intended tick, never inferred from delivery/removal/refund. */
  readonly requestedSequence: number;
  readonly requestedTick: number;
  readonly scheduledTick: number;
  /** Scoped actual money remains separate from physical insertion/removal. Null retains its missing-money gap. */
  readonly paymentOperationId: number | null;
  readonly refundOperationId: number | null;
}
