import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionOperationV1 } from "./skirmish-ai-runtime-production-operation";
import type { normalizeRuntimeScopedQueuePayments } from "./skirmish-ai-runtime-scoped-queue-payments";

/**
 * Diagnostic AI lineage, not RuntimeProductionEvidenceV1. Retains actual accepted intent and observer order;
 * it cannot supply fair geometry, full decision cadence, setup provenance or complete event liability proof.
 */
export interface RuntimeProductionCausalityV1 {
  readonly schemaVersion: 1;
  readonly failures: readonly string[];
  /** Original capture gaps remain attached even when an individual causal chain is sound. */
  readonly gaps: readonly string[];
  readonly commands: readonly {
    readonly requestedSequence: number;
    readonly requestedTick: number;
    readonly receiptSequence: number;
    readonly acceptedIntent: AiIntentV1;
    /** Exact accepting result when captured; null leaves the missing-decision gap. */
    readonly decision: Extract<AiRuntimeProductionFactV1, { kind: "decision_selected" }> | null;
    readonly requestBoundary: NonNullable<AiRuntimeProductionFactV1["boundaryState"]> | null;
    readonly command: GameCommand;
    /** Application may precede the finished dispatch receipt in single-player. */
    readonly deliveries: readonly Extract<AiRuntimeProductionFactV1, { kind: "command_delivered" }>[];
    readonly outcomes: readonly Extract<AiRuntimeProductionFactV1, { kind: "outcome" }>[];
  }[];
  /** Exact raw operation boundaries, including the genuine post-progress callback; never promoted to full event obligations. */
  readonly operationBoundaries: readonly Extract<AiRuntimeProductionFactV1, {
    kind: "queue_resource" | "queue_changed" | "queue_progress"
  }>[];
  /** Complete scoped money/progress intervals; nullable unspent claims keep unsupported ownership explicit. */
  readonly operations: readonly RuntimeProductionOperationV1[];
  /** Legacy immediate-payment diagnostic, separate from the actual post-progress per-tick operations. */
  readonly payments: ReturnType<typeof normalizeRuntimeScopedQueuePayments>["payments"];
}
