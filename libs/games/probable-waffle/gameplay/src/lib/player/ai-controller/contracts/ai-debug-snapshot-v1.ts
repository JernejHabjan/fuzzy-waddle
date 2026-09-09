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
    readonly questions: readonly {
      readonly questionId: string;
      readonly kind: string;
      readonly state: string;
      readonly createdTick: AiSimulationTick;
    }[];
    readonly incidents: readonly {
      readonly incidentId: string;
      readonly kind: string;
      readonly severity: number;
      readonly confidencePermille: number;
      readonly expiresAtTick: AiSimulationTick;
    }[];
    readonly squads: readonly {
      readonly squadId: string;
      readonly taskForceId: string | null;
      readonly role: string;
      readonly domain: string;
      readonly state: string;
      readonly members: number;
      readonly objectiveId: string | null;
      readonly targetActorId: string | null;
      readonly targetPlayerNumber: PlayerNumber | null;
      readonly assemblyDeadlineTick: AiSimulationTick | null;
      readonly effectDeadlineTick: AiSimulationTick | null;
      readonly script: string | null;
      readonly engagementRatioPermille: number | null;
      readonly confidencePermille: number | null;
      readonly predictedFriendlyLossPermille: number | null;
      readonly observedLossCount: number;
      readonly lastUsefulEffectTick: AiSimulationTick | null;
      readonly targetSwitchReason: string;
      readonly damageReservationCount: number;
      readonly orderedActorCount: number;
      readonly oscillationCount: number;
      readonly mobileReserveCount: number;
      readonly assignedPositions: readonly {
        readonly actorId: string;
        readonly position: { readonly x: number; readonly y: number; readonly z: number };
      }[];
      readonly objectiveAlternatives: readonly {
        readonly objectiveId: string;
        readonly score: number;
        readonly reason: string;
      }[];
    }[];
    readonly mode: {
      readonly state: string;
      readonly hopelessSinceTick: AiSimulationTick | null;
      readonly concessionIntentId: string | null;
      readonly reason: string | null;
    };
    readonly timeline: readonly {
      readonly eventId: string;
      readonly tick: AiSimulationTick;
      readonly kind: string;
      readonly subjectId: string;
      readonly detail: string;
    }[];
  }>;
  /** Saved Stage-10 base and placement facts; panel consumers never perform a fresh placement query. */
  readonly bases: readonly {
    readonly baseId: string;
    readonly lifecycle: string;
    readonly anchorActorId: string | null;
    readonly memberCount: number;
    readonly accessNodeId: string | null;
    readonly reservedSiteKey: string | null;
    readonly rejectedSiteCount: number;
    readonly expansionTrigger: string | null;
  }[];
  /** Saved Stage-11 graph facts, including the intentionally traversable opening. */
  readonly fortifications: readonly {
    readonly planId: string;
    readonly baseId: string | null;
    readonly lifecycle: string;
    readonly nodes: readonly {
      readonly nodeId: string;
      readonly kind: string;
      readonly lifecycle: string;
      readonly position: { readonly x: number; readonly y: number; readonly z: number };
      readonly marginalCoverage: number;
      readonly targetDomains: readonly string[];
      readonly defenderPostReachable: boolean;
      readonly componentId: string;
      readonly dependsOnNodeId: string | null;
    }[];
    readonly terrainAnchorTileKeys: readonly string[];
    readonly protectedAssetCount: number;
    readonly openingNodeId: string | null;
    readonly wholeConnectivity: string;
    readonly incrementalConnectivity: string;
    readonly spendPermille: number | null;
    readonly breachReason: string | null;
    readonly breachRisk: string;
    readonly recoveryAttempts: number;
    readonly defenderPosts: number;
    readonly reachableDefenderPosts: number;
    readonly budgetRemaining: readonly { readonly resourceType: string; readonly amount: number }[];
  }[];
  /** Saved Stage-12 recovery ladder facts; no panel may re-evaluate a live blocker. */
  readonly recovery: readonly {
    readonly recoveryKey: string;
    readonly domain: string;
    readonly cause: string;
    readonly attempt: number;
    readonly state: string;
    readonly nextRetryTick: AiSimulationTick;
    readonly phaseDeadlineTick: AiSimulationTick;
    readonly alternate: string | null;
    readonly releasedClaimCount: number;
  }[];
  /** Caster/healer windows and effect claims captured at the same decision boundary. */
  readonly support: readonly {
    readonly planId: string;
    readonly kind: string;
    readonly actorIds: readonly string[];
    readonly targetIds: readonly string[];
    readonly spellType: string | null;
    readonly state: string;
    readonly effectId: string | null;
    readonly usefulCapacity: number;
    readonly expiresAtTick: AiSimulationTick | null;
    readonly reason: string;
  }[];
  /** Stage-14 recorded evidence, role targets and legal technology rationale. */
  readonly adaptation: Readonly<{
    readonly evidence: readonly {
      readonly evidenceId: string;
      readonly kind: string;
      readonly sourceContactId: string;
      readonly observedTick: AiSimulationTick;
      readonly confidencePermille: number;
      readonly consecutiveEvaluations: number;
      readonly permittedFacts: readonly string[];
    }[];
    readonly roleTargets: readonly {
      readonly role: string;
      readonly desired: number;
      readonly evidenceIds: readonly string[];
    }[];
    readonly lastTransitionTick: AiSimulationTick | null;
    readonly lastTransitionReason: string | null;
    readonly selectedResearchType: string | null;
    readonly selectedResearchScore: number | null;
    readonly cancellationPolicy: string;
  }>;
  readonly runtimeLimits: Readonly<{
    readonly decisionSequence: number;
    readonly continuationCursors: readonly { readonly owner: string; readonly cursor: number }[];
    readonly laneService: readonly {
      readonly lane: string;
      readonly deficit: number;
      readonly lastServicedTick: AiSimulationTick;
    }[];
    readonly retainedTraceDecisions: number;
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
