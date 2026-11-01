import type { RuntimeProducerRoutes } from "../../navigation/controls/routing/skirmish-ai-runtime-producer-routes";
import type { RuntimeMovement } from "../../navigation/skirmish-ai-runtime-movement";
import type { RuntimeServiceAttempt } from "../../economy/service/skirmish-ai-runtime-service-attempt";
import type { RuntimeResourceCredit } from "../../economy/capture/ownership/skirmish-ai-runtime-resource-credit";
import type { projectRuntimeResourceServices } from "../../economy/service/skirmish-ai-runtime-resource-service-projection";
import type { RuntimeProductionCancellation } from "../cancellation/skirmish-ai-runtime-production-cancellation";
import type { RuntimeProductionCompletion } from "../completion/skirmish-ai-runtime-production-completion";
import type { RuntimeProductionRejection } from "../cancellation/skirmish-ai-runtime-production-rejection";
import type { RuntimeProductionQueueMutation } from "../queues/skirmish-ai-runtime-production-queue-mutation";
import type { AiIntent } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
// prettier-ignore
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeProductionOperation } from "../evidence/skirmish-ai-runtime-production-operation";
import type { normalizeRuntimeScopedQueuePayments } from "../ownership/skirmish-ai-runtime-scoped-queue-payments";
import type { RuntimeProductionWorldSnapshot } from "../world/skirmish-ai-runtime-production-world-snapshot";
import type { RuntimeProductionInitialQueue } from "../queues/skirmish-ai-runtime-production-initial-queue";
import type { RuntimeProductionDecision } from "./skirmish-ai-runtime-production-decision";
import type { RuntimeProductionSpatialAuthority } from "../authority/skirmish-ai-runtime-production-spatial-authority";
import type { RuntimeProductionEffectRetention } from "../lifecycle/skirmish-ai-runtime-production-effect-retention";
import type { RuntimeConstructionCatalogEntry } from "../../construction/capture/skirmish-ai-runtime-construction-catalog-entry";
import type { RuntimeConstructionLineage } from "../../construction/capture/skirmish-ai-runtime-construction-lineage";
// prettier-ignore
import type { AiRuntimeInitialConstruction } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/construction/ai-runtime-initial-construction";

import type { RuntimeProductionEvidence } from "../evidence/skirmish-ai-runtime-production-evidence";

/**
 * Diagnostic AI lineage, not RuntimeProductionEvidence. Retains actual accepted intent and observer order;
 * it cannot supply full navigation/exposure, cadence closure, paired setup, stable usefulness or complete event liabilities.
 */
export interface RuntimeProductionCausality {
  /** Checked queue lifecycle inputs in observer order; other lifecycle families and full fair setup remain separate. */
  readonly queueLifecycleEvents?: RuntimeProductionEvidence["events"];
  /** Shared sampled definition prices, rejecting changed definitions; prerequisites remain decision/command authority. */
  readonly definitionCatalog?: RuntimeProductionEvidence["catalog"];
  /** Checked enqueue-only contract inputs; absence of other event kinds still prevents full production evidence. */
  readonly enqueues?: RuntimeProductionEvidence["events"];
  readonly schemaVersion: 1;
  readonly failures: readonly string[];
  /** Original capture gaps remain attached even when an individual causal chain is sound. */
  readonly gaps: readonly string[];
  /** Actual owned readiness/options and exact current fair positions; full reachability/setup/usefulness remains open. */
  readonly worldSnapshots: readonly RuntimeProductionWorldSnapshot[];
  /** Setup joins actual paused insertion/payment. A per-tick enqueue is explicitly unpaid. */
  readonly initialQueues: readonly RuntimeProductionInitialQueue[];
  /** Every captured selected step, including empty decisions, with its actual input and configured scheduler cadence. */
  readonly decisions: readonly RuntimeProductionDecision[];
  /** Existing native service/output queries and exact completed-product demand lineage; no useful arrival claim. */
  readonly producerRoutes: RuntimeProducerRoutes;
  /** Native physical execution/return boundaries, independently from query results and later useful service. */
  readonly movements: readonly RuntimeMovement[];
  /** Owned native gather/drop-off attempts and results, never credited-income or cargo fulfillment. */
  readonly serviceAttempts: readonly RuntimeServiceAttempt[];
  /** Scoped actual beneficiary/balance changes and independently observed whole-pile contributors; no usefulness verdict. */
  readonly resourceCredits: readonly RuntimeResourceCredit[];
  /** Selected aggregate needs and declared interval diagnostics; unsupported usefulness/capacity remain null. */
  readonly resourceServices: ReturnType<typeof projectRuntimeResourceServices>;
  readonly spatialAuthority: RuntimeProductionSpatialAuthority;
  /** Exact callback-time attempts/transitions, including repeated refunds; no saved paid-price ledger or full history. */
  readonly constructionAuthority: readonly Extract<AiRuntimeProductionFact, { kind: "construction_authority" }>[];
  /** Installation-time inventory only. Null keeps legacy, failed-reader and overflow membership unavailable. */
  readonly initialConstruction: AiRuntimeInitialConstruction | null;
  /** Exact retrospective placement/admission versus installation/restore ownership, preserving every separate attempt. */
  readonly constructionLineage: readonly RuntimeConstructionLineage[];
  /** Exact shared admission price and independently sampled effective site definition; no charge or history is implied. */
  readonly constructionCatalog: readonly RuntimeConstructionCatalogEntry[];
  /** Rejected requests/applications retain native release authority without inventing a stamped admitted command. */
  readonly rejections: readonly RuntimeProductionRejection[];
  /** Actual completed products/tech; strategic usefulness and stable-effect acceptance remain separate. */
  readonly completions: readonly RuntimeProductionCompletion[];
  /** Later ordered actor/tech samples linked to exact completions; never a continuous or useful-effect oracle verdict. */
  readonly effectRetention: readonly RuntimeProductionEffectRetention[];
  /** Exact distinct native cancellation/removal/refund; this supplies no useful replacement or AI strategy proof. */
  readonly cancellations: readonly RuntimeProductionCancellation[];
  readonly commands: readonly {
    readonly requestedSequence: number;
    readonly requestedTick: number;
    readonly receiptSequence: number;
    readonly acceptedIntent: AiIntent;
    /** Exact accepting result when captured; null leaves the missing-decision gap. */
    readonly decision: Extract<AiRuntimeProductionFact, { kind: "decision_selected" }> | null;
    readonly requestBoundary: NonNullable<AiRuntimeProductionFact["boundaryState"]> | null;
    readonly command: GameCommand;
    /** Application may precede the finished dispatch receipt in single-player. */
    readonly deliveries: readonly Extract<AiRuntimeProductionFact, { kind: "command_delivered" }>[];
    readonly outcomes: readonly Extract<AiRuntimeProductionFact, { kind: "outcome" }>[];
  }[];
  /** Exact raw operation boundaries, including the genuine post-progress callback; never promoted to full event obligations. */
  readonly operationBoundaries: readonly Extract<
    AiRuntimeProductionFact,
    {
      kind: "queue_resource" | "queue_changed" | "queue_progress" | "queue_mutation";
    }
  >[];
  /** Exact native physical insertion/removal intervals; full lifecycle/useful-effect evidence remains separate. */
  readonly queueMutations: readonly RuntimeProductionQueueMutation[];
  /** Complete scoped money/progress intervals; nullable unspent claims keep unsupported ownership explicit. */
  readonly operations: readonly RuntimeProductionOperation[];
  /** Actual scoped immediate charges and refunds; per-tick charges stay in post-progress operations. */
  readonly payments: ReturnType<typeof normalizeRuntimeScopedQueuePayments>["payments"];
}
