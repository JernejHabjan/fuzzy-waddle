import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentDecisionV1 } from "./ai-intent-v1";
import type { AiSimulationTick } from "./ai-core-types";

/** Explicit completeness flags prevent partial traces from being presented as exact explanations. */
export interface AiDiagnosticCompletenessV1 {
  readonly observation: "complete" | "truncated" | "missing";
  readonly priorState: "complete" | "truncated" | "missing";
  readonly outcomes: "complete" | "truncated" | "missing";
  readonly alternatives: "complete" | "truncated" | "not_recorded";
  readonly missingRanges: readonly { readonly fromTick: AiSimulationTick; readonly toTick: AiSimulationTick }[];
  readonly truncatedEventCount: number;
}

/** Bounded causal link used by filters and timeline drilldown. */
export interface AiCausalIndexEntryV1 {
  readonly causeId: string;
  readonly causeKind: "goal" | "demand" | "intent" | "claim" | "command" | "outcome" | "blocker" | "evidence";
  readonly relatedIds: readonly string[];
  readonly tick: AiSimulationTick;
}

/** Typed placeholder for a panel owned by a later implementation stage. */
export interface AiDebugSectionStateV1 {
  readonly status: "ready" | "not_ready" | "unsupported";
  readonly ownerStage: number;
  readonly reason: string | null;
}

/**
 * Read-only projection from the exact committed decision data. No UI consumer may invoke a
 * planner, pathfinder, RNG or world query to populate missing fields.
 */
export interface AiDebugSnapshotV1 {
  readonly schemaVersion: 1;
  readonly playerNumber: PlayerNumber;
  readonly faction: FactionType;
  readonly profileVersion: string;
  readonly archetypeId: string;
  readonly tick: AiSimulationTick;
  readonly generation: number;
  readonly decisionSequence: number;
  readonly stance: string;
  readonly goalId: string | null;
  readonly commitmentUntilTick: AiSimulationTick;
  readonly topReasons: readonly string[];
  readonly decisions: readonly AiIntentDecisionV1[];
  readonly nextActions: readonly string[];
  readonly mainBlockingReason: string | null;
  readonly progressHealth:
    | "healthy"
    | "waiting"
    | "recovering"
    | "failed_optional"
    | "technical_fault"
    | "strategic_defeat";
  readonly causalIndex: readonly AiCausalIndexEntryV1[];
  readonly completeness: AiDiagnosticCompletenessV1;
  readonly sections: Readonly<{
    buildOrder: AiDebugSectionStateV1;
    productionComposition: AiDebugSectionStateV1;
    economyLabor: AiDebugSectionStateV1;
    intelligenceEnvironment: AiDebugSectionStateV1;
    squadsSupport: AiDebugSectionStateV1;
    transport: AiDebugSectionStateV1;
    basesFortifications: AiDebugSectionStateV1;
    decisionsRecovery: AiDebugSectionStateV1;
    runtimeLimits: AiDebugSectionStateV1;
  }>;
}
