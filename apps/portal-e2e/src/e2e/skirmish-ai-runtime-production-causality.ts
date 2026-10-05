import type { RuntimeProductionCancellationV1 } from "./skirmish-ai-runtime-production-cancellation";
import type { RuntimeProductionCompletionV1 } from "./skirmish-ai-runtime-production-completion";
import type { RuntimeProductionRejectionV1 } from "./skirmish-ai-runtime-production-rejection";
import type { RuntimeProductionQueueMutationV1 } from "./skirmish-ai-runtime-production-queue-mutation";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionOperationV1 } from "./skirmish-ai-runtime-production-operation";
import type { normalizeRuntimeScopedQueuePayments } from "./skirmish-ai-runtime-scoped-queue-payments";
import type { RuntimeProductionWorldSnapshotV1 } from "./skirmish-ai-runtime-production-world-snapshot";
import type { RuntimeProductionInitialQueueV1 } from "./skirmish-ai-runtime-production-initial-queue";
import type { RuntimeProductionDecisionV1 } from "./skirmish-ai-runtime-production-decision";
import type { RuntimeProductionSpatialAuthorityV1 } from "./skirmish-ai-runtime-production-spatial-authority";
import type { RuntimeProductionEffectRetentionV1 } from "./skirmish-ai-runtime-production-effect-retention";

/**
 * Diagnostic AI lineage, not RuntimeProductionEvidenceV1. Retains actual accepted intent and observer order;
 * it cannot supply full navigation/exposure, cadence closure, paired setup, stable usefulness or complete event liabilities.
 */
export interface RuntimeProductionCausalityV1 {
  readonly schemaVersion: 1;
  readonly failures: readonly string[];
  /** Original capture gaps remain attached even when an individual causal chain is sound. */
  readonly gaps: readonly string[];
  /** Actual owned readiness/options and exact current fair positions; full reachability/setup/usefulness remains open. */
  readonly worldSnapshots: readonly RuntimeProductionWorldSnapshotV1[];
  /** Setup joins actual paused insertion/payment. A per-tick enqueue is explicitly unpaid. */
  readonly initialQueues: readonly RuntimeProductionInitialQueueV1[];
  /** Every captured selected step, including empty decisions, with its actual input and configured scheduler cadence. */
  readonly decisions: readonly RuntimeProductionDecisionV1[];
  readonly spatialAuthority: RuntimeProductionSpatialAuthorityV1;
  /** Rejected requests/applications retain native release authority without inventing a stamped admitted command. */
  readonly rejections: readonly RuntimeProductionRejectionV1[];
  /** Actual completed products/tech; strategic usefulness and stable-effect acceptance remain separate. */
  readonly completions: readonly RuntimeProductionCompletionV1[];
  /** Later ordered actor/tech samples linked to exact completions; never a continuous or useful-effect oracle verdict. */
  readonly effectRetention: readonly RuntimeProductionEffectRetentionV1[];
  /** Exact distinct native cancellation/removal/refund; this supplies no useful replacement or AI strategy proof. */
  readonly cancellations: readonly RuntimeProductionCancellationV1[];
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
    kind: "queue_resource" | "queue_changed" | "queue_progress" | "queue_mutation"
  }>[];
  /** Exact native physical insertion/removal intervals; full lifecycle/useful-effect evidence remains separate. */
  readonly queueMutations: readonly RuntimeProductionQueueMutationV1[];
  /** Complete scoped money/progress intervals; nullable unspent claims keep unsupported ownership explicit. */
  readonly operations: readonly RuntimeProductionOperationV1[];
  /** Actual scoped immediate charges and refunds; per-tick charges stay in post-progress operations. */
  readonly payments: ReturnType<typeof normalizeRuntimeScopedQueuePayments>["payments"];
}
