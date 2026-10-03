import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Serializable operation samples. These raw callbacks do not establish legal setup or normalized causal acceptance. */
export type QueueResourceEmissionRecord = {
  /** Scene-local scope identity. It has no save/restore or multiplayer identity semantics. */
  readonly operationId: number;
  readonly requested: Readonly<Partial<Record<ResourceType, number>>> | null;
  readonly before: Readonly<Record<ResourceType, number>> | null;
  readonly snapshotRestoreInProgress: boolean;
} & (
  | { readonly phase: "started" }
  | {
    /** Shared affordability denied this attempt: no emitter or queue progress is invoked. */
    readonly phase: "denied";
    readonly reason: "insufficient_resources";
  }
  | {
    readonly phase: "callback";
    readonly callbackOrdinal: number;
    readonly amounts: Readonly<Partial<Record<ResourceType, number>>> | null;
  }
  | {
    readonly phase: "finished";
    readonly status: "returned" | "threw";
    readonly after: Readonly<Record<ResourceType, number>> | null;
    /** Saturates at nine, meaning at least nine. Only the first eight exact callbacks are emitted. */
    readonly callbackCount: number;
    readonly callbackLimitExceeded: boolean;
    /** Nested observed emissions make this outer balance interval ambiguous, even when vectors are equal. */
    readonly nestedEmission: boolean;
    /** A matching delta requires one exact callback and valid scoped samples; it is not normalized causal evidence. */
    readonly balanceMatches: boolean;
  }
);
