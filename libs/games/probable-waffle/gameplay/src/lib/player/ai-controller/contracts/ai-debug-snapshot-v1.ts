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

/** Recorded explanation status; absent evaluation is never presented as a rejected alternative. */
export interface AiWhyNotExplanationV1 {
  readonly subjectId: string;
  readonly status: "not_evaluated" | "not_recorded" | "rejected" | "outcome_unresolved";
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
  readonly profileDifficulty: "easy" | "normal" | "hard" | "unknown";
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
  readonly whyNot: readonly AiWhyNotExplanationV1[];
  /** Bounded saved transport facts and recorded overlay anchors; never a live pathfinder query. */
  readonly transportOperations: readonly {
    readonly planId: string;
    readonly phase: string;
    readonly routeKind: string;
    readonly routeGeneration: number;
    readonly graphGeneration: number | null;
    readonly passengers: number;
    readonly transports: number;
    readonly capacity: string;
    readonly deadlineTick: AiSimulationTick;
    readonly recoveryAttempt: number;
    readonly terminalReason: string | null;
    readonly pickupPosition: { readonly x: number; readonly y: number; readonly z: number } | null;
    readonly landingPosition: { readonly x: number; readonly y: number; readonly z: number } | null;
  }[];
  /** Bounded Stage-9 strategic facts captured at the decision boundary. */
  readonly skirmish: Readonly<{
    readonly questions: readonly { readonly questionId: string; readonly kind: string; readonly state: string; readonly createdTick: AiSimulationTick }[];
    readonly incidents: readonly { readonly incidentId: string; readonly kind: string; readonly severity: number; readonly confidencePermille: number; readonly expiresAtTick: AiSimulationTick }[];
    readonly squads: readonly { readonly squadId: string; readonly role: string; readonly state: string; readonly members: number; readonly objectiveId: string | null; readonly targetPlayerNumber: PlayerNumber | null; readonly assemblyDeadlineTick: AiSimulationTick | null; readonly effectDeadlineTick: AiSimulationTick | null }[];
    readonly mode: { readonly state: string; readonly hopelessSinceTick: AiSimulationTick | null; readonly concessionIntentId: string | null; readonly reason: string | null };
    readonly timeline: readonly { readonly eventId: string; readonly tick: AiSimulationTick; readonly kind: string; readonly subjectId: string; readonly detail: string }[];
  }>;
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
