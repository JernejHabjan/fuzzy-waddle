import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiEvidenceId, AiSimulationTick } from "../ai-core-types";
import type { AiDemandV1 } from "../ai-plan-contracts";

/** Resource forecasts and production demands kept outside a global blackboard. */
export interface AiEconomyProductionStateV1 {
  readonly demands: readonly AiDemandV1[];
  /** Last committed macro decision; absent in older saves until the next decision boundary. */
  readonly workforce?: Readonly<{
    readonly workers: number;
    readonly queuedWorkers: number;
    readonly assignedWorkers: number;
    readonly desiredWorkers: number;
    readonly desiredFoodSources: number;
    readonly foodRunwayTicks: number;
    readonly blocker: "resource_saturation" | null;
    readonly economyPermille: number;
    readonly defensePermille: number;
  }>;
  readonly posture?: Readonly<{
    readonly status: "safe" | "pressured" | "emergency";
    readonly enteredTick: AiSimulationTick;
    readonly lastThreatTick: AiSimulationTick | null;
  }>;
  readonly forecasts: readonly {
    readonly resourceType: ResourceType;
    readonly horizonTick: AiSimulationTick;
    readonly amount: number;
    readonly confidencePermille: number;
  }[];
  /** Bounded adaptation evidence, transition and technology rationale for save/replay/debug. */
  readonly adaptation: Readonly<{
    readonly evidence: readonly {
      readonly evidenceId: AiEvidenceId;
      readonly kind: "flyer" | "water_or_transport" | "area_damage" | "static_fortification";
      readonly sourceContactId: string;
      readonly observedTick: AiSimulationTick;
      readonly confidencePermille: number;
      /** Re-observation confirms persistence; it never adds invented enemy mass. */
      readonly consecutiveEvaluations: number;
      readonly permittedFacts: readonly string[];
    }[];
    readonly activeRoleTargets: readonly {
      readonly role: "frontline" | "ranged" | "support" | "anti_air" | "water_control" | "fortification_breaker";
      readonly desired: number;
      readonly evidenceIds: readonly AiEvidenceId[];
    }[];
    readonly lastTransitionTick: AiSimulationTick | null;
    readonly lastTransitionReason: string | null;
    readonly selectedResearchType: string | null;
    readonly selectedResearchScore: number | null;
    readonly cancellationPolicy: "retain_committed_production";
  }>;
}
