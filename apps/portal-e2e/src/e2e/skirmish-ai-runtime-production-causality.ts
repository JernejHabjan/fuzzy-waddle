import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { normalizeRuntimeScopedQueuePayments } from "./skirmish-ai-runtime-scoped-queue-payments";

/**
 * Diagnostic AI lineage, not RuntimeProductionEvidenceV1. Retains actual accepted intent and observer order;
 * it cannot supply fair geometry, decision cadence, setup provenance or event-time liabilities.
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
    readonly command: GameCommand;
    /** Application may precede the finished dispatch receipt in single-player. */
    readonly deliveries: readonly Extract<AiRuntimeProductionFactV1, { kind: "command_delivered" }>[];
    readonly outcomes: readonly Extract<AiRuntimeProductionFactV1, { kind: "outcome" }>[];
  }[];
  /** Only validated immediate-operation lineage; per-tick/denied operations retain explicit gaps. */
  readonly payments: ReturnType<typeof normalizeRuntimeScopedQueuePayments>["payments"];
}
