import type { ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Local callback boundaries, never a saved ledger or proof of complete construction/payment history. */
export type ConstructionAuthorityRecord = {
  readonly state: ConstructionStateEnum;
  /** Work remaining in simulation milliseconds; not a wall-clock deadline. */
  readonly remainingWorkMs: number;
  readonly snapshotRestoreInProgress: boolean;
} & (
  | {
    readonly kind: "lifecycle";
    /** Finished precedes actor upgrade; restored means setData applied, not full snapshot completion. */
    readonly transition: "started" | "finished" | "restored" | "teardown";
  }
  | {
    readonly kind: "resource";
    readonly operation: "start_charge" | "cancel_refund";
    /** Returned emission is separate from an exact callback and its observed balance delta. */
    readonly status: "skipped" | "denied" | "returned" | "threw";
    /** Explicit native owner argument; null must not be filled from the emitter's local-player fallback. */
    readonly ownerArgument: number | null;
    /** Definition sampled by this native invocation, independent of the earlier admission/catalog sample. */
    readonly configuredCostType: number;
    readonly requiredWorkMs: number;
    readonly configuredCost: Readonly<Partial<Record<ResourceType, number>>> | null;
    readonly requested: Readonly<Partial<Record<ResourceType, number>>> | null;
    /** Actual computed site/progress multiplier for cancellation; null for a start attempt. */
    readonly refundFactor: number | null;
    /** Exact synchronous operation samples for the explicit owner; null preserves missing/invalid authority. */
    readonly before: Readonly<Record<ResourceType, number>> | null;
    readonly after: Readonly<Record<ResourceType, number>> | null;
    readonly callbackAmounts: Readonly<Partial<Record<ResourceType, number>>> | null;
    /** Saturates at nine (at least nine); no callback history is accumulated. */
    readonly callbackCount: number;
    /** Another observed construction interval nested here; global resource ownership remains unproven. */
    readonly nestedEmission: boolean;
    /** Exact input-reference callback plus matching scoped samples; never complete liability/ownership authority. */
    readonly balanceMatches: boolean;
  }
);
