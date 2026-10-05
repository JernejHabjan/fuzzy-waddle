/**
 * Test-owned ordered facts for independent production oracles. The runtime adapter must capture real committed
 * snapshots and applied events; fixtures may declare expectations but must never manufacture these records.
 */
export interface RuntimeProductionEvidenceV1 {
  /** Shared causal setup digest excludes only the declared transition, exposure or paid cancellation variable. */
  readonly pairedSetupDigest: string;
  readonly initialProducerIds: readonly string[];
  readonly initialProductActorIds: readonly string[];
  readonly initialPaidItemIds: readonly string[];
  /** Prices/durations match the shared command's definition lookup; researched product level is separate raw authority. */
  readonly catalog: readonly {
    readonly productKey: string;
    readonly kind: "production" | "research" | "construction";
    readonly cost: Readonly<Record<string, number>>;
    /** Per-tick cost is the entire stored vector charged once for every successful queue tick. */
    readonly payment: "immediate" | "per_successful_tick";
    /** Definition duration converted to fixed simulation ticks. */
    readonly durationTicks: number;
  }[];
  readonly snapshots: readonly {
    readonly tick: number;
    readonly transition: {
      readonly planId: string;
      readonly demandId: string;
      readonly committedTick: number;
      readonly beginsTick: number;
      readonly forceDeadlineTick: number;
      readonly desiredForce: number;
      readonly status: "committed" | "abandoned";
    } | null;
    readonly leases: readonly {
      readonly claimId: string;
      readonly planId: string;
      readonly optional: boolean;
      readonly state: "forecast" | "provisional" | "dispatched" | "applied_spending" | "refundable_work";
    }[];
    readonly usefulDemand: number;
    /** Tech authority facts, distinct from a research completion self-report. */
    readonly completedResearchKeys: readonly string[];
    readonly producers: readonly {
      readonly actorId: string;
      readonly objectName: string;
      readonly ready: boolean;
      readonly position: { readonly x: number; readonly y: number };
      /** Only owned/fair committed reachability, not a path inferred from coordinate proximity. */
      readonly reachable: boolean;
      readonly lanes: readonly { readonly laneId: string; readonly capacity: number; readonly itemIds: readonly string[] }[];
    }[];
    readonly products: readonly { readonly actorId: string; readonly productKey: string }[];
    readonly visibleThreats: readonly {
      readonly actorId: string;
      readonly observedTick: number;
      readonly position: { readonly x: number; readonly y: number };
      /** Effective building-target weapon reach in logical tiles; absent/hidden opponents cannot prove exposure. */
      readonly buildingRange: number;
    }[];
  }[];
  /**
   * Strict sequence is application order, including same-tick events. Cancellation requests are dispatch facts,
   * not applied money. Money before/after is sampled from the
   * shared resource authority; expected refunds stay separate until the actual resource-added application.
   */
  readonly events: readonly {
    readonly sequence: number;
    readonly tick: number;
    /** Intended command tick on a real pre-application request; absent for ordinary applied facts. */
    readonly scheduledTick?: number;
    /** Queue-authority remaining successful charges before enqueue/payment, required for per-tick evidence. */
    readonly remainingSuccessfulTicks?: number;
    readonly commandId: string;
    readonly effectId: string;
    readonly planId: string | null;
    readonly kind: "construct" | "enqueue" | "enqueue_rejected" | "pay" | "complete" | "cancel_requested" | "cancel" | "refund" | "loss";
    readonly actorId: string;
    readonly productKey: string;
    readonly itemId: string | null;
    readonly laneId: string | null;
    readonly createdActorId: string | null;
    readonly resourcesBefore: Readonly<Record<string, number>>;
    readonly resourcesAfter: Readonly<Record<string, number>>;
    readonly reservedUnspent: Readonly<Record<string, number>>;
    readonly obligationsDue: Readonly<Record<string, number>>;
    readonly obligationsAfter: Readonly<Record<string, number>>;
    readonly charged: Readonly<Record<string, number>>;
    readonly refundForItemId: string | null;
    readonly refundAmounts: Readonly<Record<string, number>>;
  }[];
}
