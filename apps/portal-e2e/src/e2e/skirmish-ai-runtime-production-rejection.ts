import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommandInput, GameCommandOutcomeReason, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Native rejection diagnostic; no physical item, credited refund, useful effect or full production evidence is implied. */
export interface RuntimeProductionRejectionV1 {
  readonly stage: "admission" | "application";
  readonly requestedSequence: number;
  readonly requestedTick: number;
  readonly receiptSequence: number;
  readonly sequence: number;
  readonly tick: number;
  /** Null when the shared authority rejected without publishing any stamped outcome. */
  readonly commandId: string | null;
  /** Null for admission rejection: the unstamped request supplies no intended application time. */
  readonly scheduledTick: number | null;
  readonly reason: GameCommandOutcomeReason;
  readonly request: GameCommandInput;
  readonly acceptedIntent: AiIntentV1;
  readonly decision: Extract<AiRuntimeProductionFactV1, { kind: "decision_selected" }>;
  readonly nativeOutcome: Extract<AiRuntimeProductionFactV1, { kind: "outcome" }> | null;
  /** Both samples belong to the same callback sequence: before and after its diagnostic ledger update. */
  readonly boundarySequences: readonly [number, number];
  readonly resourcesBefore: Readonly<Record<ResourceType, number>> | null;
  readonly resourcesAfter: Readonly<Record<ResourceType, number>> | null;
  readonly obligationsBefore: Readonly<Record<ResourceType, number>> | null;
  readonly obligationsAfter: Readonly<Record<ResourceType, number>> | null;
  /** Exact selected/admitted claim release; unsupported ownership remains null. Pending claims are not added. */
  readonly reservedUnspentBefore: Readonly<Record<ResourceType, number>> | null;
  readonly reservedUnspentAfter: Readonly<Record<ResourceType, number>> | null;
}
