import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * One independently checked cash/progress interval, retained by the causal diagnostic. This is not a complete
 * production event: enqueue/removal, useful products, catalog and fair setup require their own authorities.
 * Unspent values are null when the captured queue-claim ledger cannot be reconciled; pending claims are never added.
 */
export interface RuntimeProductionOperationV1 {
  readonly sequence: number;
  readonly tick: number;
  readonly kind: "immediate_charge" | "cancellation_refund" | "tick_charge" | "tick_denied";
  /** Cancellation uses its own command; originatingCommandId always names the purchased item. */
  readonly commandId: string;
  readonly originatingCommandId: string;
  readonly effectId: string;
  readonly planId: string;
  readonly actorId: string;
  readonly itemId: string;
  readonly operationId: number;
  /** Only genuine shared progress scopes have a lane/attempt and remaining successful charges. */
  readonly laneId: string | null;
  readonly attemptId: number | null;
  readonly remainingSuccessfulTicks: number | null;
  readonly boundarySequences: readonly [number, number];
  readonly resourcesBefore: Readonly<Record<ResourceType, number>>;
  readonly resourcesAfter: Readonly<Record<ResourceType, number>>;
  readonly obligationsDue: Readonly<Record<ResourceType, number>>;
  readonly obligationsAfter: Readonly<Record<ResourceType, number>>;
  readonly reservedUnspentBefore: Readonly<Record<ResourceType, number>> | null;
  readonly reservedUnspentAfter: Readonly<Record<ResourceType, number>> | null;
  readonly charged: Readonly<Record<ResourceType, number>>;
  readonly refundAmounts: Readonly<Record<ResourceType, number>>;
  /** Scoped reconciliation only. Original callback gaps remain in the capture and top-level diagnostic. */
  readonly reconciledCallbackSequences: readonly number[];
}
